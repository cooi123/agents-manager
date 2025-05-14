import React from 'react';
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Loading,
  Tag,
  Button,
} from '@carbon/react';
import { Download, Search, ChevronDown } from '@carbon/icons-react';
import { useProjectStore } from '../../store/projectStore';
import { formatDate } from '../../utils/formatters';
import ServiceUsageDetails from './ServiceUsageDetails';
import { Database } from '../../types/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  subtasks?: Transaction[];
};

interface ServiceUsageListProps {
  projectId?: string;
  serviceId?: string;
  documentId?: string;
}

interface ServiceUsageDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  usage: Transaction | null;
}

const ServiceUsageList: React.FC<ServiceUsageListProps> = ({ projectId, serviceId, documentId }) => {
  const { fetchServiceTransactions } = useProjectStore();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedUsage, setSelectedUsage] = React.useState<Transaction | null>(null);
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());
  
  // Fetch transactions when component mounts or when filters change
  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (projectId && serviceId) {
          const data = await fetchServiceTransactions(projectId, serviceId);
          setTransactions(data);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [projectId, serviceId, fetchServiceTransactions]);
  
  // Filter records by document if documentId is provided
  const filteredRecords = React.useMemo(() => {
    if (!documentId) return transactions;
    return transactions.filter(record => 
      record.input_document_urls.includes(documentId)
    );
  }, [transactions, documentId]);

  const toggleAccordion = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  const headers = [
    { key: 'status', header: 'Status' },
    { key: 'created_at', header: 'Date' },
    { key: 'description', header: 'Description' },
    { key: 'documents', header: 'Documents' },
    { key: 'input', header: 'Input' },
    { key: 'result', header: 'Result' },
  ];
  
  const rows = filteredRecords.map((record) => ({
    id: record.id,
    status: record.status,
    created_at: formatDate(record.updated_at || record.created_at),
    description: record.description || '-',
    documents: record.input_document_urls.length > 0 ? 'View Documents' : 'No Documents',
    input: record.input_data ? JSON.stringify(record.input_data).substring(0, 50) + '...' : '-',
    result: record.result_payload ? 'View Details' : '-',
    subtasks: record.subtasks || []
  }));

  if (loading) {
    return <Loading />;
  }

  if (filteredRecords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Tag type="cool-gray">No Transactions</Tag>
        <p className="mt-4">
          {documentId 
            ? "No services have been used with this document" 
            : "No transactions found for this service"}
        </p>
      </div>
    );
  }

  return (
    <>
      <DataTable rows={rows} headers={headers}>
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader {...getHeaderProps({ header })}>
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const record = filteredRecords.find(r => r.id === row.id);
                const hasSubtasks = record?.subtasks && record.subtasks.length > 0;
                const isExpanded = expandedItems.has(row.id);

                return (
                  <React.Fragment key={row.id}>
                    <TableRow {...getRowProps({ row })}>
                      {row.cells.map((cell) => (
                        <TableCell>
                          {cell.info.header === 'status' ? (
                            <div className="flex items-center gap-2">
                              {hasSubtasks && (
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  renderIcon={ChevronDown}
                                  iconDescription="Toggle subtasks"
                                  onClick={() => toggleAccordion(row.id)}
                                  className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                />
                              )}
                              <Tag type={
                                cell.value === 'running' ? 'blue' : 
                                cell.value === 'completed' ? 'green' :
                                cell.value === 'failed' ? 'red' :
                                'cool-gray'
                              }>
                                {cell.value}
                              </Tag>
                            </div>
                          ) : cell.info.header === 'documents' && cell.value !== 'No Documents' ? (
                            <div className="flex gap-2">
                              <Button
                                kind="ghost"
                                size="sm"
                                renderIcon={Download}
                                iconDescription="Download Documents"
                              >
                                Download
                              </Button>
                            </div>
                          ) : cell.info.header === 'result' && cell.value !== '-' ? (
                            <div className="flex gap-2">
                              <Button
                                kind="ghost"
                                size="sm"
                                renderIcon={Search}
                                iconDescription="View Details"
                                onClick={() => {
                                  const usage = filteredRecords.find(r => r.id === row.id);
                                  if (usage) setSelectedUsage(usage);
                                }}
                              >
                                Details
                              </Button>
                            </div>
                          ) : (
                            cell.value
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {hasSubtasks && isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-4">
                          <div className="space-y-4">
                            {/* Parent task input */}
                            <div>
                              <h4 className="font-semibold mb-2">Input</h4>
                              <pre className="bg-gray-50 p-2 rounded text-sm overflow-x-auto">
                                {JSON.stringify(record.input_data, null, 2)}
                              </pre>
                            </div>
                            {/* Parent task result */}
                            <div>
                              <h4 className="font-semibold mb-2">Result</h4>
                              <pre className="bg-gray-50 p-2 rounded text-sm overflow-x-auto">
                                {JSON.stringify(record.result_payload, null, 2)}
                              </pre>
                            </div>
                            {/* Subtasks */}
                            <div className="space-y-4">
                              {(record?.subtasks ?? []).map((subtask) => (
                                <div key={subtask.id} className="border border-gray-200 bg-gray-50 rounded p-4 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Tag type={
                                      subtask.status === 'running' ? 'blue' :
                                      subtask.status === 'completed' ? 'green' :
                                      subtask.status === 'failed' ? 'red' :
                                      'cool-gray'
                                    }>
                                      {subtask.status}
                                    </Tag>
                                    <span className="text-sm text-gray-600">
                                      {formatDate(subtask.updated_at || subtask.created_at)}
                                    </span>
                                  </div>
                                  {subtask.description && (
                                    <div>
                                      <h4 className="font-semibold">Description</h4>
                                      <p className="text-sm text-gray-700">{subtask.description}</p>
                                    </div>
                                  )}
                                  {subtask.error_message && (
                                    <div>
                                      <h4 className="font-semibold text-red-600">Error</h4>
                                      <p className="text-red-600">{subtask.error_message}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DataTable>
      <ServiceUsageDetails
        isOpen={selectedUsage !== null}
        onClose={() => setSelectedUsage(null)}
        usage={selectedUsage}
      />
    </>
  );
};

export default ServiceUsageList;