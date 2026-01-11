
import { supabase, formatError } from './supabase';

/**
 * Enquiry Integration Service
 * Manages the domain-isolated lifecycle of enquiries.
 */
export const EnquiryService = {
    /**
     * Verifies an enquiry code and integrates the identity node into the Enquiry Desk.
     */
    async verifyAndLinkEnquiry(code: string, branchId: number | null) {
        try {
            if (!code) throw new Error("Verification token required.");

            // branchId can be null for Head Office
            const { data, error } = await supabase.rpc('admin_verify_enquiry_code', {
                p_code: code.trim().toUpperCase(),
                p_branch_id: branchId
            });

            if (error) throw error;
            
            // Handle error in response data
            if (data && data.success === false) {
                throw new Error(data.message || "Protocol rejection.");
            }

            return {
                success: true,
                message: data?.message || "Identity synchronized successfully.",
                enquiryId: data?.enquiry_id,
                targetModule: 'Enquiries'
            };
        } catch (err) {
            const formatted = formatError(err);
            console.error("Enquiry Synchronization Failure:", formatted);
            throw new Error(formatted);
        }
    },

    /**
     * Finalizes the enquiry stage and promotes the node to the Admission Vault.
     */
    async convertToAdmission(enquiryId: string) {
        try {
            if (!enquiryId) throw new Error("Node ID required for conversion.");

            const { data, error } = await supabase.rpc('convert_enquiry_to_admission', {
                p_enquiry_id: enquiryId
            });

            if (error) throw error;
            if (data && data.success === false) throw new Error(data.message);

            return {
                success: true,
                message: data?.message || "Promotion finalized.",
                admissionId: data?.admission_id
            };
        } catch (err) {
            const formatted = formatError(err);
            console.error("Enquiry Promotion Failure:", formatted);
            throw new Error(formatted);
        }
    }
};
