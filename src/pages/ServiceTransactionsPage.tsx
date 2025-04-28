import React from 'react';
import { Grid, Column, Tile } from '@carbon/react';
import ServiceUsageList from '../components/services/ServiceUsageList';

const ServiceTransactionsPage: React.FC = () => {
  return (
    <Grid fullWidth className="p-5">
      <Column lg={16} md={8} sm={4}>
        <h1 className="text-3xl font-bold mb-6">Service Transactions</h1>
        
        <Tile className="p-5">
          <ServiceUsageList />
        </Tile>
      </Column>
    </Grid>
  );
};

export default ServiceTransactionsPage;