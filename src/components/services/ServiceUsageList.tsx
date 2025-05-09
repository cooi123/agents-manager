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
import { Download, Search } from '@carbon/icons-react';
import { useProjectStore } from '../../store/projectStore';
import { formatDate } from '../../utils/formatters';
import ServiceUsageDetails from './ServiceUsageDetails';

interface ServiceUsageListProps {
  projectId?: string;
  serviceId?: string;
  documentId?: string;
}

const ServiceUsageList: React.FC<ServiceUsageListProps> = ({ projectId, serviceId, documentId }) => {
  const { fetchServiceTransactions } = useProjectStore();
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedUsage, setSelectedUsage] = React.useState<any>(null);
  
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
    return transactions.filter(record => record.document_id === documentId);
  }, [transactions, documentId]);
  
  const headers = [
    { key: 'status', header: 'Status' },
    { key: 'created_at', header: 'Date' },
    { key: 'document', header: 'Document' },
    { key: 'custom_input', header: 'Additional Info' },
    { key: 'result', header: 'Result' },
  ];
  
  const rows = filteredRecords.map((record) => ({
    id: record.id,
    status: record.status,
    created_at: formatDate(record.completed_at || record.created_at),
    document: record.document_id ? 'View Document' : 'No Document',
    custom_input: record.custom_input || '-',
    result: record.result ? (
      typeof record.result === 'string' 
        ? record.result.substring(0, 50) + (record.result.length > 50 ? '...' : '')
        : 'View Details'
    ) : '-',
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
              {rows.map((row) => (
                <TableRow {...getRowProps({ row })}>
                  {row.cells.map((cell) => (
                    <TableCell>
                      {cell.info.header === 'status' ? (
                         <Tag type={
                          cell.value === 'PROCESSING' ? 'blue' : 
                          cell.value === 'completed' || cell.value === 'SUCCESS' ? 'green' :
                          'red'  // For failed, error, or any other status
                        }>
                          {cell.value}
                        </Tag>
                      ) : cell.info.header === 'document' && cell.value !== 'No Document' ? (
                        <div className="flex gap-2">
                          <Button
                            kind="ghost"
                            size="sm"
                            renderIcon={Download}
                            iconDescription="Download Document"
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
              ))}
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