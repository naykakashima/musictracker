"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { BookOpen, FileText, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { proxyFetcher } from '@/lib/utils';
interface Endpoint {
  endpoint: string;
  route: string;
  methods: string[];
  description: string;
}

interface APIDocs {
  api_name: string;
  version: string;
  documentation: Endpoint[];
}

export default function APIDocumentation() {
  const [docs, setDocs] = useState<APIDocs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

const { data, error: fetchError } = useSWR('http://localhost:5000/api/docs', proxyFetcher);

useEffect(() => {
    if (data) {
        setDocs(data);
        setLoading(false);
    }
    if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
    }
}, [data, error, fetchError]);
  
  // Group endpoints by category
  const getEndpointCategories = () => {
    if (!docs) return {};
    
    return docs.documentation.reduce<Record<string, Endpoint[]>>((acc, endpoint) => {
      const route = endpoint.route;
      
      // Extract category from route
      let category = 'General';
      
      if (route.includes('/auth') || route.includes('/login') || route.includes('/refresh')) {
        category = 'Authentication';
      } else if (route.includes('/user')) {
        category = 'User Data';
      } else if (route.includes('/stats')) {
        category = 'Statistics';
      } else if (route.includes('/api/me')) {
        category = 'User Profile';
      }
      
      if (!acc[category]) {
        acc[category] = [];
      }
      
      acc[category].push(endpoint);
      return acc;
    }, {});
  };
  
  const categories = getEndpointCategories();
  
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-500';
      case 'POST': return 'bg-green-500';
      case 'PUT': return 'bg-amber-500';
      case 'DELETE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner />
          <p>Loading API documentation...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-red-600">Documentation Error</CardTitle>
            <CardDescription>
              Failed to load API documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
            <p className="mt-4">
              Make sure the backend server is running at http://localhost:5000
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 pb-16">
      <div className="flex items-center gap-2 mb-8">
        <BookOpen className="text-primary h-6 w-6" />
        <h1 className="text-3xl font-bold">{docs?.api_name || 'API'} Documentation</h1>
        <Badge variant="outline" className="ml-2">v{docs?.version || '1.0'}</Badge>
      </div>
      
      <p className="text-muted-foreground max-w-2xl mb-8">
        This documentation is automatically generated from the docstrings in your Flask API routes.
        It provides an overview of all available endpoints, their methods, and descriptions.
      </p>
      
      <Tabs defaultValue="endpoints" className="mb-8">
        <TabsList>
          <TabsTrigger value="endpoints" className="flex items-center gap-1">
            <LinkIcon className="h-4 w-4" />
            <span>Endpoints</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="endpoints">
          {Object.entries(categories).map(([category, endpoints]) => (
            <div key={category} className="mb-10">
              <h2 className="text-2xl font-bold mb-4">{category}</h2>
              <div className="grid gap-4">
                {endpoints.map((endpoint) => (
                  <Card key={endpoint.endpoint} className="overflow-hidden">
                    <CardHeader className="bg-slate-50 pb-2">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <CardTitle className="font-mono text-base">
                          {endpoint.route}
                        </CardTitle>
                        <div className="flex gap-2">
                          {endpoint.methods.map(method => (
                            <Badge key={method} className={`${getMethodColor(method)} text-white`}>
                              {method}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <CardDescription className="font-mono text-xs">
                        {endpoint.endpoint}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="whitespace-pre-wrap">
                        {endpoint.description || 'No description available.'}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>API Overview</CardTitle>
              <CardDescription>
                A summary of the available endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-2">Route</th>
                    <th className="text-left p-2">Methods</th>
                    <th className="text-left p-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {docs?.documentation.map((endpoint, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="font-mono p-2">{endpoint.route}</td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          {endpoint.methods.map(method => (
                            <Badge key={method} className={`${getMethodColor(method)} text-white`}>
                              {method}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-2">
                        {endpoint.description?.split('\n')[0] || 'No description'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="text-center mt-12 text-muted-foreground text-sm">
        <p>
          <Link href="/dashboard" className="text-primary hover:underline">
            Return to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}