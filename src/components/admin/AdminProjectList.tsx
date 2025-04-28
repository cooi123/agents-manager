import React, { useEffect } from 'react';
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Link,
  Loading,
  Tag,
} from '@carbon/react';
import { useProjectStore } from '../../store/projectStore';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

const AdminProjectList: React.FC = () => {
  const { projects, loading, fetchAllProjects } = useProjectStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchAllProjects();
  }, [fetchAllProjects]);
  
  const headers = [
    { key: 'name', header: 'Project Name' },
    { key: 'user_id', header: 'Owner ID' },
    { key: 'created_at', header: 'Created' },
    { key: 'actions', header: 'Actions' },
  ];
  
  const rows = projects.map((project) => ({
    id: project.id,
    name: project.name,
    user_id: project.user_id,
    created_at: formatDate(project.created_at),
    actions: 'View',
  }));
  
  const handleRowClick = (rowId: string) => {
    navigate(`/admin/projects/${rowId}`);
  };
  
  if (loading) {
    return <Loading />;
  }
  
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Tag type="cool-gray">No Projects</Tag>
        <p className="mt-4">No projects have been created yet</p>
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
              <TableRow
                key={row.id}
                {...getRowProps({ row })}
                onClick={() => handleRowClick(row.id)}
                className="cursor-pointer"
              >
                {row.cells.map((cell) => (
                  <TableCell key={cell.id}>
                    {cell.info.header === 'actions' ? (
                      <Link href={`/admin/projects/${row.id}`}>View</Link>
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

export default AdminProjectList;