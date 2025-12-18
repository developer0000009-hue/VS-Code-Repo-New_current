import React from 'react';
import { DashboardIcon } from '../icons/DashboardIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { StudentsIcon } from '../icons/StudentsIcon';
import { TeacherIcon } from '../icons/TeacherIcon';
import { KeyIcon } from '../icons/KeyIcon';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { ClassIcon } from '../icons/ClassIcon';
import { CoursesIcon } from '../icons/CoursesIcon';
import { ChecklistIcon } from '../icons/ChecklistIcon';
import { TimetableIcon } from '../icons/TimetableIcon';
import { BookIcon } from '../icons/BookIcon';
import { FinanceIcon } from '../icons/FinanceIcon';
import { CommunicationIcon } from '../icons/CommunicationIcon';
import { MailIcon } from '../icons/MailIcon';
import { Role, BuiltInRoles } from '../../types';

export interface MenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
}

export interface MenuGroup {
    id: string;
    title: string;
    items: MenuItem[];
}

// Permission Mapping for different admin roles
const PERMISSIONS: Record<string, Set<string>> = {
    [BuiltInRoles.SCHOOL_ADMINISTRATION]: new Set(['all']),
    [BuiltInRoles.BRANCH_ADMIN]: new Set(['Dashboard', 'Analytics', 'User Management', 'Student Management', 'Teacher Management', 'Code Verification', 'Enquiries', 'Admissions', 'Classes', 'Courses', 'Attendance', 'Timetable', 'Homework', 'Finance', 'Facility Management', 'Meetings', 'Communication']),
    // FIX: Restricted Principal to high-level reporting as per security spec.
    [BuiltInRoles.PRINCIPAL]: new Set(['Dashboard', 'Analytics']),
    [BuiltInRoles.HR_MANAGER]: new Set(['Dashboard', 'User Management', 'Teacher Management', 'Attendance', 'Meetings', 'Student Management']),
    [BuiltInRoles.ACADEMIC_COORDINATOR]: new Set(['Dashboard', 'Student Management', 'Teacher Management', 'Classes', 'Courses', 'Timetable', 'Homework', 'Analytics']),
    [BuiltInRoles.ACCOUNTANT]: new Set(['Dashboard', 'Finance', 'Student Management']),
};


export const getAdminMenu = (isHeadOfficeAdmin: boolean, userRole: Role): MenuGroup[] => {
    const allGroups: MenuGroup[] = [
        {
            id: 'overview',
            title: 'Overview',
            items: [
                { id: 'Dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" /> },
                { id: 'Analytics', label: 'Analytics', icon: <ChartBarIcon className="w-5 h-5" /> },
            ]
        },
        {
            id: 'management',
            title: 'Management',
            items: [
                { id: 'Branches', label: 'Branches & Admins', icon: <SchoolIcon className="w-5 h-5" /> },
                { id: 'User Management', label: 'Users', icon: <UsersIcon className="w-5 h-5" /> },
                { id: 'Student Management', label: 'Students', icon: <StudentsIcon className="w-5 h-5" /> },
                { id: 'Teacher Management', label: 'Teachers', icon: <TeacherIcon className="w-5 h-5" /> },
            ]
        },
        {
            id: 'admissions',
            title: 'Admissions',
            items: [
                { id: 'Code Verification', label: 'Verification', icon: <KeyIcon className="w-5 h-5" /> },
                { id: 'Enquiries', label: 'Enquiries', icon: <MailIcon className="w-5 h-5" /> },
                { id: 'Admissions', label: 'Applications', icon: <ClipboardListIcon className="w-5 h-5" /> },
            ]
        },
        {
            id: 'academics',
            title: 'Academics',
            items: [
                { id: 'Classes', label: 'Classes', icon: <ClassIcon className="w-5 h-5" /> },
                { id: 'Courses', label: 'Courses', icon: <CoursesIcon className="w-5 h-5" /> },
                { id: 'Attendance', label: 'Attendance', icon: <ChecklistIcon className="w-5 h-5" /> },
                { id: 'Timetable', label: 'Timetable', icon: <TimetableIcon className="w-5 h-5" /> },
                { id: 'Homework', label: 'Homework', icon: <BookIcon className="w-5 h-5" /> },
            ]
        },
        {
            id: 'operations',
            title: 'Operations',
            items: [
                { id: 'Finance', label: 'Finance', icon: <FinanceIcon className="w-5 h-5" /> },
                { id: 'Facility Management', label: 'Facilities', icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-4h8v4" /></svg> },
                { id: 'Meetings', label: 'Meetings', icon: <UsersIcon className="w-5 h-5" /> },
            ]
        },
        {
            id: 'communication',
            title: 'Connect',
            items: [
                { id: 'Communication', label: 'Communication', icon: <CommunicationIcon className="w-5 h-5" /> },
            ]
        }
    ];

    const userPermissions = PERMISSIONS[userRole] || new Set();
    const canAccessAll = userPermissions.has('all');

    return allGroups.map(group => {
        const filteredItems = group.items.filter(item => {
            if (canAccessAll) {
                // School Admin can see Branches, others can't see this item at all.
                if (item.id === 'Branches') return isHeadOfficeAdmin;
                return true;
            }

            // Specific check for Branches for non-super-admins
            if (item.id === 'Branches') return false;

            return userPermissions.has(item.id);
        });

        return { ...group, items: filteredItems };
    }).filter(group => group.items.length > 0);
};