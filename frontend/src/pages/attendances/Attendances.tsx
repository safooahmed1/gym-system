import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { api } from '../../services/api';
import { Attendance, AttendanceFilters } from '../../types';
import { formatDateTime } from '../../utils/helpers';
import { Search, Calendar, Clock, Users, TrendingUp } from 'lucide-react';
import { useState, FormEvent } from 'react';

export default function Attendances() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<AttendanceFilters>({ page: 1, limit: 50 });
  const [search, setSearch] = useState('');

  const { data: attendancesData, isLoading } = useQuery({
    queryKey: ['attendances', filters],
    queryFn: () => api.get<{ success: boolean; data: Attendance[]; meta: any }>('/attendances', { params: filters }).then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['attendance-stats'],
    queryFn: () => api.get<{ success: boolean; data: any }>('/attendances/stats').then(r => r.data.data),
  });

  const columns = [
    { key: 'memberName', header: t('members.memberList') },
    { key: 'memberAccountId', header: t('members.accountId') },
    { key: 'checkInAt', header: t('common.date'), render: (item: Attendance) => formatDateTime(item.checkInAt) },
  ];

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('attendances.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('attendances.attendanceList')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2"><Users className="h-4 w-4" />{t('attendances.todayCount')}</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.todayUnique || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2"><Clock className="h-4 w-4" />{t('attendances.uniqueMembersToday')}</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.todayUnique || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2"><TrendingUp className="h-4 w-4" />{t('attendances.weekCount')}</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-gray-900 dark:text-gray-100">-</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2"><Calendar className="h-4 w-4" />{t('attendances.monthCount')}</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-gray-900 dark:text-gray-100">-</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Input type="date" value={filters.dateFrom || ''} onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value || undefined }))} className="w-full sm:w-48" />
            <Input type="date" value={filters.dateTo || ''} onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value || undefined }))} className="w-full sm:w-48" />
          </form>

          <Table
            columns={columns}
            data={attendancesData?.data || []}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            pagination={attendancesData?.meta ? { page: attendancesData.meta.page, totalPages: attendancesData.meta.totalPages, onPageChange: (page) => setFilters(prev => ({ ...prev, page })) } : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}