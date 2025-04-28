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
} from '@carbon/react';
import { useUserStore } from '../../store/userStore';
import { formatDate } from '../../utils/formatters';

const UserList: React.FC = () => {
  const { users, loading, fetchUsers } = useUserStore();
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const headers = [
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { key: 'created_at', header: 'Registered' },
  ];
  
  const rows = users.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    created_at: formatDate(user.created_at),
  }));
  
  if (loading) {
    return <Loading />;
  }
  
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Tag type="cool-gray">No Users</Tag>
        <p className="mt-4">No users found in the system</p>
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
                    {cell.info.header === 'role' ? (
                      <Tag type={cell.value === 'admin' ? 'red' : 'blue'}>
                        {cell.value}
                      </Tag>
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

export default UserList;