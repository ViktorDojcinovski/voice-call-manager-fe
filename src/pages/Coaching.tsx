import React, { useEffect, useState } from 'react';
import dashboardData from '../data/dashboardData.json';

interface DialingSession {
  id: number;
  name: string;
  title: string;
  company: string;
  phone: string;
  status: string;
  active: boolean;
  email?: string;
}

interface ContactInfo {
  fullName: string;
  title: string;
  directPhone: string;
  email: string;
  linkedin: string;
}

interface CompanyInfo {
  name: string;
  seo: string;
  website: string;
  generalPhone: string;
  linkedin: string;
  revenue: string;
  employees: string;
}

export default function Coaching() {
  const [sessions, setSessions] = useState<DialingSession[]>([]);
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    setSessions(dashboardData.activeDialingSessions);
    setContact(dashboardData.contactInformation);
    setCompany(dashboardData.companyInformation);
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Active Dialing Session</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`p-4 rounded-lg shadow border ${
              session.active ? 'bg-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            <p className="text-sm font-semibold">
              <span className="inline-block w-3 h-3 rounded-full mr-2 bg-gray-700" />
              {session.status}
            </p>
            <h4 className="font-bold">{session.name}</h4>
            <p className="text-sm">{session.title}</p>
            <p className="text-sm">{session.company}</p>
            <p className="font-medium">{session.phone}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
          {contact && (
            <ul className="text-sm">
              <li><strong>Full name:</strong> {contact.fullName}</li>
              <li><strong>Title:</strong> {contact.title}</li>
              <li><strong>Direct phone:</strong> {contact.directPhone}</li>
              <li><strong>Email:</strong> {contact.email}</li>
              <li><strong>LinkedIn profile:</strong> {contact.linkedin}</li>
            </ul>
          )}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Company information</h3>
          {company && (
            <ul className="text-sm">
              <li><strong>Name:</strong> {company.name}</li>
              <li><strong>SEO:</strong> {company.seo}</li>
              <li><strong>Website:</strong> {company.website}</li>
              <li><strong>General phone:</strong> {company.generalPhone}</li>
              <li><strong>LinkedIn page:</strong> {company.linkedin}</li>
              <li><strong>Revenue:</strong> {company.revenue}</li>
              <li><strong>Employees:</strong> {company.employees}</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
