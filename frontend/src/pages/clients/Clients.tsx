import { useEffect, useState } from 'react';
import { Plus, Search, Building2, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { clientsApi } from '../../api/clients.api';
import { BASE_URL } from '../../api/axios';
import type { Client } from '../../types/client.types';

export const Clients = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            setLoading(true);
            const response = await clientsApi.getAll();
            setClients(response.data || []);
        } catch (error) {
            toast.error('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter((client) =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                    <p className="text-gray-600 mt-1">Manage your clients</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <Plus className="w-5 h-5" />
                    New Client
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Clients Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <p className="text-gray-600">No clients found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map((client) => (
                        <div
                            key={client.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                {client.logo ? (
                                    <img
                                        src={`${BASE_URL}/${client.logo}`}
                                        alt={client.name}
                                        className="w-12 h-12 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-blue-600" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{client.name}</h3>
                                    {client.company && (
                                        <p className="text-sm text-gray-600 truncate">{client.company}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                {client.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Mail className="w-4 h-4" />
                                        <span className="truncate">{client.email}</span>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone className="w-4 h-4" />
                                        <span>{client.phone}</span>
                                    </div>
                                )}
                            </div>

                            {client.description && (
                                <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                                    {client.description}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
