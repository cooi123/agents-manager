import React, { useEffect } from 'react';
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
import { Edit, TrashCan } from '@carbon/icons-react';
import { useServiceStore } from '../../store/serviceStore';
import { formatDate } from '../../utils/formatters';

interface ServiceListProps {
  onEdit: (service: any) => void;
}

const ServiceList: React.FC<ServiceListProps> = ({ onEdit }) => {
  const { services, loading, fetchServices, deleteService } = useServiceStore();
  
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);
  
  const headers = [
    { key: 'name', header: 'Name' },
    { key: 'url', header: 'URL' },
    { key: 'created_at', header: 'Created' },
    { key: 'actions', header: 'Actions' },
  ];
  
  const rows = services.map((service) => ({
    id: service.id,
    name: service.name,
    url: service.url,
    created_at: formatDate(service.created_at),
  }));
  
  if (loading) {
    return <Loading />;
  }
  
  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Tag type="cool-gray">No Services</Tag>
        <p className="mt-4">No services have been registered yet</p>
      </div>
    );
  }
  
  return (
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
                    {cell.info.header === 'actions' ? (
                      <div className="flex gap-2">
                        <Button
                          kind="ghost"
                          size="sm"
                          renderIcon={Edit}
                          iconDescription="Edit"
                          onClick={() => {
                            const service = services.find(s => s.id === row.id);
                            if (service) onEdit(service);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          kind="danger--ghost"
                          size="sm"
                          renderIcon={TrashCan}
                          iconDescription="Delete"
                          onClick={() => deleteService(row.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    ) : cell.info.header === 'url' ? (
                      <a 
                        href={cell.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {cell.value}
                      </a>
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
  );
};

export default ServiceList;