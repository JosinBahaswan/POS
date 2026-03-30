import { useState, useEffect, useMemo } from "react";
import { Customer } from "../types";
import { readCustomers } from "../database";

export function useCustomerSelect() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const refreshCustomers = () => {
    setCustomers(readCustomers([]));
  };

  useEffect(() => {
    refreshCustomers();
  }, []);

  const selectedCustomer = useMemo(() => 
    customers.find(c => c.id === selectedCustomerId) || null,
  [customers, selectedCustomerId]);

  return {
    customers,
    selectedCustomerId,
    selectedCustomer,
    setSelectedCustomerId,
    refreshCustomers
  };
}
