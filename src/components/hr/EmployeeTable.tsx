import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Employee = Database['public']['Tables']['employees']['Row'];

type SortField = 'name' | 'position' | 'country' | 'salary' | 'start_date';
type SortDirection = 'asc' | 'desc' | null;

interface EmployeeTableProps {
  employees: Employee[];
  isLoading: boolean;
  onEdit: (employee: Employee) => void;
  onRefetch: () => void;
  searchQuery: string;
  perPaycheckMap?: Map<string, number>;
}

export const EmployeeTable = ({
  employees,
  isLoading,
  onEdit,
  onRefetch,
  searchQuery,
  perPaycheckMap,
}: EmployeeTableProps) => {
  const [sortField, setSortField] = useState<SortField | null>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const getFilteredEmployees = () => {
    if (!searchQuery.trim()) return employees;

    const query = searchQuery.toLowerCase();
    return employees.filter(emp => {
      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      const nickname = emp.nickname?.toLowerCase() || '';
      const position = emp.position.toLowerCase();
      const email = emp.email.toLowerCase();
      
      return fullName.includes(query) || 
             nickname.includes(query) || 
             position.includes(query) || 
             email.includes(query);
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedEmployees = () => {
    const filtered = getFilteredEmployees();
    if (!sortField || !sortDirection) return filtered;

    return [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
          break;
        case 'position':
          aValue = a.position.toLowerCase();
          bValue = b.position.toLowerCase();
          break;
        case 'country':
          aValue = a.country.toLowerCase();
          bValue = b.country.toLowerCase();
          break;
        case 'salary':
          aValue = Number(a.salary_amount);
          bValue = Number(b.salary_amount);
          break;
        case 'start_date':
          aValue = a.start_date ? new Date(a.start_date).getTime() : 0;
          bValue = b.start_date ? new Date(b.start_date).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const formatSalary = (amount: number, type: string) => {
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const period = type === 'weekly' ? 'w' : type === 'monthly' ? 'm' : 'y';
    return `$${formatted}/${period}`;
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading employees...</div>;
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No employees found. Add your first team member to get started.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead 
            className="cursor-pointer select-none hover:bg-muted/50"
            onClick={() => handleSort('name')}
          >
            <div className="flex items-center">
              Name
              <SortIcon field="name" />
            </div>
          </TableHead>
          <TableHead 
            className="cursor-pointer select-none hover:bg-muted/50"
            onClick={() => handleSort('position')}
          >
            <div className="flex items-center">
              Position
              <SortIcon field="position" />
            </div>
          </TableHead>
          <TableHead 
            className="cursor-pointer select-none hover:bg-muted/50"
            onClick={() => handleSort('salary')}
          >
            <div className="flex items-center">
              Salary
              <SortIcon field="salary" />
            </div>
          </TableHead>
          <TableHead>Per Paycheck</TableHead>
          <TableHead>Status</TableHead>
          <TableHead 
            className="cursor-pointer select-none hover:bg-muted/50"
            onClick={() => handleSort('country')}
          >
            <div className="flex items-center">
              Country
              <SortIcon field="country" />
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {getSortedEmployees().map((employee) => (
          <TableRow key={employee.id}>
            <TableCell className="font-medium">
              <button
                onClick={() => onEdit(employee)}
                className="text-left hover:text-primary transition-colors cursor-pointer"
              >
                {employee.first_name} {employee.last_name}
                {employee.nickname && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({employee.nickname})
                  </span>
                )}
              </button>
            </TableCell>
            <TableCell>{employee.position}</TableCell>
            <TableCell>{formatSalary(Number(employee.salary_amount), employee.salary_type)}</TableCell>
            <TableCell>
              {perPaycheckMap?.has(employee.id)
                ? `$${(perPaycheckMap.get(employee.id) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'}
            </TableCell>
            <TableCell>
              <span className={employee.is_active ? 'text-blue-600 font-medium' : 'text-muted-foreground'}>
                {employee.is_active ? 'Active' : 'Inactive'}
              </span>
            </TableCell>
            <TableCell>
              <span className={`inline-flex items-center gap-1 ${
                employee.country === 'Philippines' ? 'text-blue-600 font-medium' : ''
              }`}>
                {employee.country === 'Philippines' && '🇵🇭 PH'}
                {employee.country === 'United States' && '🇺🇸 US'}
                {employee.country !== 'Philippines' && employee.country !== 'United States' && employee.country}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
