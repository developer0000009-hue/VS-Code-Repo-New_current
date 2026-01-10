import { supabase, formatError } from './supabase';

/**
 * Enquiry Domain Service
 * Manages the domain-isolated lifecycle of enquiries.
 */
export const EnquiryService = {
    /**
     * Processes an enquiry identity verification.
     * Strictly updates Enquiry state and synchronizes it to the processing branch.
     */
    async processEnquiryVerification(enquiryId: string | number, branchId?: string | null) {
        try {
            // BigInt columns in Postgres need careful handling in JS.
            // We ensure the ID is a valid string representation of the numeric identifier.
            const id = (typeof enquiryId === 'string' || typeof enquiryId === 'number') 
                ? String(enquiryId) 
                : null;
            
            if (!id || id === 'undefined' || id === 'null' || id === '0') {
                throw new Error("Protocol Failure: The verification link is not associated with a valid registry node.");
            }

            const updates: any = { 
                status: 'ENQUIRY_VERIFIED',
                updated_at: new Date().toISOString()
            };

            // CRITICAL: Claim the enquiry for this branch context to ensure visibility in the local Enquiry Desk
            if (branchId) {
                updates.branch_id = branchId;
            }

            // Execute atomic update
            const { data, error } = await supabase
                .from('enquiries')
                .update(updates)
                .eq('id', id)
                .select()
                .maybeSingle();

            if (error) throw error;
            
            // If no data returned, the record either doesn't exist or RLS blocked the update
            if (!data) {
                // Verification Check: Distinguish between 'Missing' and 'Access Denied'
                const { data: exists } = await supabase
                    .from('enquiries')
                    .select('id')
                    .eq('id', id)
                    .maybeSingle();

                if (!exists) {
                    throw new Error(`Registry Mismatch: The enquiry record could not be located. It may have been archived or purged from the master registry.`);
                } else {
                    throw new Error(`Security Exception: Access denied for this node. Ensure your administrator profile has clearance for the target branch.`);
                }
            }

            return {
                success: true,
                message: "Enquiry identity verified and local node synchronized.",
                enquiry: data,
                targetModule: 'Enquiries'
            };
        } catch (err) {
            console.error("Enquiry Domain Processing Failure:", formatError(err));
            throw new Error(formatError(err));
        }
    },

    /**
     * Finalizes the enquiry stage and promotes the node to the Admission Vault.
     */
    async convertToAdmission(enquiryId: string | number) {
        try {
            const id = String(enquiryId);
            if (!id) throw new Error("Node ID required for promotion protocol.");

            const { data, error } = await supabase.rpc('convert_enquiry_to_admission', {
                p_enquiry_id: id
            });

            if (error) throw error;
            
            if (!data) throw new Error("Promotion protocol failed: Remote node returned no response.");
            if (!data.success) throw new Error(data.message);

            return {
                success: true,
                message: data.message,
                admissionId: String(data.admission_id)
            };
        } catch (err) {
            const formatted = formatError(err);
            console.error("Enquiry Promotion Failure:", formatted);
            throw new Error(formatted);
        }
    }
};