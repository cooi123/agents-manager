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
import { useServiceUsageStore } from '../../store/serviceUsageStore';
import { useServiceStore } from '../../store/serviceStore';
import { formatDate } from '../../utils/formatters';
import ServiceUsageDetails from './ServiceUsageDetails';

const ServiceUsageList: React.FC = () => {
  const { usageRecords, loading, fetchUsageRecords } = useServiceUsageStore();
  const { services } = useServiceStore();
  
  // Fetch both services and usage records
  React.useEffect(() => {
    Promise.all([
      fetchUsageRecords(),
      services.length === 0 && useServiceStore.getState().fetchServices(),
    ]);
  }, [fetchUsageRecords, services.length]);
  const [selectedUsage, setSelectedUsage] = React.useState<any>(null);
  
  const headers = [
    { key: 'service', header: 'Service' },
    { key: 'status', header: 'Status' },
    { key: 'created_at', header: 'Date' },
    { key: 'document', header: 'Document' },
    { key: 'custom_input', header: 'Additional Info' },
    { key: 'result', header: 'Result' },
  ];
  
  const rows = usageRecords.map((record) => {
    const service = services.find(s => s.id === record.service_id);
    return {
      id: record.id,
      service: service?.name || 'Loading...',
      status: record.status,
      created_at: formatDate(record.created_at),
      document: record.document_id ? 'View Document' : 'No Document',
      custom_input: record.custom_input || '-',
      result: record.result ? (
        typeof record.result === 'string' 
          ? record.result.substring(0, 50) + (record.result.length > 50 ? '...' : '')
          : 'View Details'
      ) : '-',
    };
  });
  
  if (loading) {
    return <Loading />;
  }
  
  if (usageRecords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Tag type="cool-gray">No Transactions</Tag>
        <p className="mt-4">You haven't used any services yet</p>
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
                  <TableHeader key={header.key} {...getHeaderProps({ header })}>
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} {...getRowProps({ row })}>
                  {row.cells.map((cell) => (
                    <TableCell key={cell.id}>
                      {cell.info.header === 'status' ? (
                        <Tag type={cell.value === 'pending' ? 'blue' : 'green'}>
                          {cell.value}
                        </Tag>
                      ) : cell.info.header === 'service' ? (
                        <span className="font-medium">{cell.value}</span>
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
                              const usage = usageRecords.find(r => r.id === row.id);
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