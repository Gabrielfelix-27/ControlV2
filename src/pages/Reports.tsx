import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer } from "@/components/ui/chart";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatCurrency, formatCurrencyInteger } from "@/lib/utils";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, getMonth, getYear, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
} from "recharts";
import { useTransactions } from '@/hooks/use-transactions';
import { Transaction } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { DateRange } from 'react-day-picker';

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const COLORS = {
  income: "#18db5e",    // Verde mais vivo
  expense: "#ff3333",   // Vermelho mais vivo
  net: "#0095ff",       // Azul mais vivo
  hours: "#f59e0b",
  uber: "#276EF1",
  "99": "#FF5A5F",
  indrive: "#00C805",
  particular: "#6E56CF",
};

const PLATFORMS = ["uber", "99", "indrive", "particular"];

export default function Reports() {
  const { transactions } = useTransactions();
  const isMobile = useIsMobile();
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()));
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));

  useEffect(() => {
    // Atualiza o intervalo de datas quando mês ou ano mudar
    const fromDate = new Date(selectedYear, selectedMonth, 1);
    setDate({
      from: startOfMonth(fromDate),
      to: endOfMonth(fromDate),
    } as DateRange);
  }, [selectedMonth, selectedYear]);

  // Filtra transações pelo intervalo de datas
  const filteredTransactions = useMemo(() => {
    if (!date?.from || !date?.to) return transactions;
    
    const fromDate = startOfMonth(date.from);
    const toDate = date.to ? endOfMonth(date.to) : endOfMonth(date.from);
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= fromDate && transactionDate <= toDate;
    });
  }, [transactions, date]);

  // Dados para gráficos
  const earningsByWeekday = useMemo(() => {
    const weekdayData = WEEKDAYS.map((day, index) => ({
      name: day,
      ganhos: 0,
      corridas: 0,
    }));

    filteredTransactions.forEach((transaction) => {
      if (transaction.type === "income") {
        const date = new Date(transaction.date);
        const weekday = getDay(date);
        weekdayData[weekday].ganhos += transaction.amount;
        weekdayData[weekday].corridas += transaction.rides || 0;
      }
    });

    return weekdayData;
  }, [filteredTransactions]);

  const summaryData = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netProfit = totalIncome - totalExpense;

    return [
      { name: "Ganhos", value: totalIncome, color: COLORS.income },
      { name: "Custos", value: totalExpense, color: COLORS.expense },
      { name: "Líquido", value: netProfit, color: COLORS.net },
    ];
  }, [filteredTransactions]);

  const monthlyNetEarnings = useMemo(() => {
    // Últimos 6 meses
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(selectedYear, selectedMonth, 1), i);
      return {
        date,
        month: format(date, "MMM", { locale: ptBR }),
        year: getYear(date),
        income: 0,
        expense: 0,
        net: 0,
      };
    }).reverse();

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthIndex = months.findIndex(
        (m) => getMonth(m.date) === getMonth(date) && getYear(m.date) === getYear(date)
      );

      if (monthIndex !== -1) {
        if (transaction.type === "income") {
          months[monthIndex].income += transaction.amount;
        } else {
          months[monthIndex].expense += transaction.amount;
        }
      }
    });

    months.forEach((month) => {
      month.net = month.income - month.expense;
    });

    return months;
  }, [transactions, selectedMonth, selectedYear]);

  const hoursAndEarnings = useMemo(() => {
    const totalHours = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (t.hoursWorked || 0), 0);
    
    const totalEarnings = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const hourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;

    return { totalHours, totalEarnings, hourlyRate };
  }, [filteredTransactions]);

  const platformEarnings = useMemo(() => {
    // Sempre inicializar com todas as plataformas, mesmo sem transações
    const platformData = PLATFORMS.map((platform) => ({
      name: platform === "99" ? "99" : platform.charAt(0).toUpperCase() + platform.slice(1),
      valor: 0,
      corridas: 0,
      color: COLORS[platform as keyof typeof COLORS],
      minValue: 1, // Valor mínimo para exibição no gráfico quando não há dados
    }));

    if (filteredTransactions.length === 0) {
      // Se não há transações, retorna as plataformas com valores zerados
      return platformData;
    }

    filteredTransactions.forEach((transaction) => {
      if (transaction.type === "income" && transaction.platform) {
        const platformIndex = PLATFORMS.findIndex(p => p === transaction.platform);
        if (platformIndex !== -1) {
          platformData[platformIndex].valor += transaction.amount;
          platformData[platformIndex].corridas += transaction.rides || 0;
        }
      }
    });

    // Se temos alguma plataforma com valor, remova o minValue para mostrar valores reais
    if (platformData.some(p => p.valor > 0)) {
      return platformData.map(p => {
        const { minValue, ...rest } = p;
        return rest;
      });
    }
    
    // Caso contrário, mantém os minValues para exibição vazia
    return platformData;
  }, [filteredTransactions]);

  // Cálculo do total de corridas
  const totalRides = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + (t.rides || 0), 0);
  }, [filteredTransactions]);

  // Componente de seleção de mês/ano
  const DateRangeSelector = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <h2 className="text-2xl font-bold">Relatórios</h2>
      <DatePickerWithRange
        date={date}
        onSelect={setDate}
      />
    </div>
  );

  // Componente para seleção de mês/ano
  const MonthYearSelector = () => (
    <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap">Selecione o período:</span>
        <Select
          value={selectedMonth.toString()}
          onValueChange={(value) => setSelectedMonth(parseInt(value))}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((month, index) => (
              <SelectItem key={index} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center gap-2">
        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => setSelectedYear(parseInt(value))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 5 }, (_, i) => getYear(new Date()) - i).map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      <DateRangeSelector />

      <Tabs defaultValue="daily" className="w-full space-y-6">
        <div className="w-full overflow-visible">
          <TabsList className="w-full p-2 bg-muted/20 rounded-lg flex flex-col sm:flex-row gap-2">
            <div className="grid grid-cols-3 w-full gap-2 mb-2 sm:mb-0 sm:flex sm:w-auto sm:space-x-1 sm:border-r sm:pr-2 sm:mr-2 sm:border-gray-300">
              <TabsTrigger 
                value="daily" 
                className="text-xs sm:text-sm whitespace-normal rounded-md data-[state=active]:bg-[#e4ff00]/10 data-[state=active]:text-[#e4ff00] data-[state=active]:font-medium shadow-sm border border-gray-200">
                Ganhos por Dia
              </TabsTrigger>
              <TabsTrigger 
                value="summary" 
                className="text-xs sm:text-sm rounded-md data-[state=active]:bg-[#e4ff00]/10 data-[state=active]:text-[#e4ff00] data-[state=active]:font-medium shadow-sm border border-gray-200">
                Resumo
              </TabsTrigger>
              <TabsTrigger 
                value="monthly" 
                className="text-xs sm:text-sm rounded-md data-[state=active]:bg-[#e4ff00]/10 data-[state=active]:text-[#e4ff00] data-[state=active]:font-medium shadow-sm border border-gray-200">
                Ganhos Mensais
              </TabsTrigger>
            </div>
            <div className="grid grid-cols-2 w-full gap-2 sm:flex sm:w-auto sm:space-x-1">
              <TabsTrigger 
                value="hours" 
                className="text-xs sm:text-sm rounded-md data-[state=active]:bg-[#e4ff00]/10 data-[state=active]:text-[#e4ff00] data-[state=active]:font-medium shadow-sm border border-gray-200">
                Horas
              </TabsTrigger>
              <TabsTrigger 
                value="platforms" 
                className="text-xs sm:text-sm rounded-md data-[state=active]:bg-[#e4ff00]/10 data-[state=active]:text-[#e4ff00] data-[state=active]:font-medium shadow-sm border border-gray-200">
                Plataformas
              </TabsTrigger>
            </div>
          </TabsList>
        </div>

        {/* Ganhos por Dia */}
        <TabsContent value="daily">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Ganhos por Dia</CardTitle>
              <CardDescription>
                Comparação entre ganhos e despesas diários
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={useMemo(() => {
                    if (!date?.from || !date?.to) return [];
                    
                    // Criar um mapa de datas para dados
                    const daysMap: Record<string, { date: string; income: number; expense: number; net: number }> = {};
                    
                    // Filtrar transações no intervalo de datas
                    filteredTransactions.forEach(transaction => {
                      const transactionDate = new Date(transaction.date);
                      const dateStr = format(transactionDate, 'dd/MM');
                      
                      if (!daysMap[dateStr]) {
                        daysMap[dateStr] = { date: dateStr, income: 0, expense: 0, net: 0 };
                      }
                      
                      if (transaction.type === 'income') {
                        daysMap[dateStr].income += transaction.amount;
                      } else {
                        daysMap[dateStr].expense += transaction.amount;
                      }
                      
                      daysMap[dateStr].net = daysMap[dateStr].income - daysMap[dateStr].expense;
                    });
                    
                    // Converter o mapa em um array e ordenar por data
                    return Object.values(daysMap).sort((a, b) => {
                      const [dayA, monthA] = a.date.split('/').map(Number);
                      const [dayB, monthB] = b.date.split('/').map(Number);
                      
                      if (monthA !== monthB) return monthA - monthB;
                      return dayA - dayB;
                    });
                  }, [filteredTransactions, date])}
                  margin={{
                    top: 20,
                    right: isMobile ? 10 : 30,
                    left: isMobile ? 0 : 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickMargin={isMobile ? 5 : 10}
                  />
                  <YAxis 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickFormatter={(value) => isMobile ? formatCurrencyInteger(value) : formatCurrency(value)}
                    width={isMobile ? 50 : 80}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      const label = 
                        name === 'income' ? 'Ganhos' : 
                        name === 'expense' ? 'Despesas' : 'Líquido';
                      return [formatCurrencyInteger(value), label];
                    }}
                    contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Legend 
                    payload={[
                      { value: 'Ganhos', type: 'rect', color: "#00ff44" },
                      { value: 'Despesas', type: 'rect', color: "#ff0000" },
                      { value: 'Líquido', type: 'rect', color: "#00ccff" }
                    ]}
                    wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  <Bar 
                    dataKey="income" 
                    name="income" 
                    fill="#00ff44" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="expense" 
                    name="expense" 
                    fill="#ff0000" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="net" 
                    name="net" 
                    fill="#00ccff" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resumo */}
        <TabsContent value="summary">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Ganhos Brutos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-green-500">
                  {formatCurrencyInteger(summaryData[0].value)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-red-500">
                  {formatCurrencyInteger(summaryData[1].value)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ganhos Líquidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-primary">
                  {formatCurrencyInteger(summaryData[2].value)}
                </div>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Número de Corridas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">
                  {totalRides}
                </div>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-2">
              <CardHeader>
                <CardTitle>Ganhos por Dia da Semana</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={earningsByWeekday}
                    margin={{
                      top: 20,
                      right: isMobile ? 10 : 30,
                      left: isMobile ? 0 : 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      tickFormatter={(value) => isMobile ? value.substring(0, 3) : value}
                    />
                    <YAxis 
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      tickFormatter={(value) => isMobile ? formatCurrencyInteger(value) : formatCurrency(value)}
                      width={isMobile ? 40 : 60}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrencyInteger(value), 'Ganhos']}
                    />
                    <Bar dataKey="ganhos" name="Ganhos" fill={COLORS.income} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ganhos Líquidos Mensais */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Ganhos Líquidos Mensais</CardTitle>
              <CardDescription>
                Evolução dos ganhos, custos e valor líquido nos últimos meses
              </CardDescription>
              <MonthYearSelector />
            </CardHeader>
            <CardContent className="h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyNetEarnings}
                  margin={{
                    top: 20,
                    right: isMobile ? 10 : 30,
                    left: isMobile ? 0 : 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickFormatter={(value) => isMobile ? formatCurrencyInteger(value) : formatCurrency(value)}
                    width={isMobile ? 50 : 80}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      const label = name === 'income' ? 'Ganhos' : 
                                    name === 'expense' ? 'Custos' : 'Líquido';
                      return [formatCurrencyInteger(value), label];
                    }}
                  />
                  <Legend 
                    payload={[
                      { value: 'Ganhos', type: 'rect', color: COLORS.income },
                      { value: 'Custos', type: 'rect', color: COLORS.expense },
                      { value: 'Líquido', type: 'line', color: COLORS.net }
                    ]}
                    wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  <Area type="monotone" dataKey="income" name="income" stackId="1" stroke={COLORS.income} fill={COLORS.income} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="expense" name="expense" stackId="2" stroke={COLORS.expense} fill={COLORS.expense} fillOpacity={0.3} />
                  <Line 
                    connectNulls
                    dataKey="net" 
                    name="net" 
                    type="linear"
                    stroke={COLORS.net}
                    fill="none"
                    strokeWidth={3}
                    dot={{ fill: COLORS.net, r: 5, strokeWidth: 1, stroke: "#fff" }}
                    activeDot={{ fill: COLORS.net, r: 8, strokeWidth: 1, stroke: "#fff" }}
                    isAnimationActive={true}
                    z={10}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Horas Trabalhadas e Ganho/Hora */}
        <TabsContent value="hours">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Horas Trabalhadas e Ganhos</CardTitle>
                <CardDescription>
                  Visão detalhada da sua eficiência por hora
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] sm:h-[400px] flex flex-col justify-center items-center">
                <div className="text-center space-y-4 sm:space-y-8">
                  <div>
                    <h3 className="text-lg font-medium text-muted-foreground">Total de Horas</h3>
                    <p className="text-2xl sm:text-4xl font-bold">{hoursAndEarnings.totalHours.toFixed(1)}h</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-muted-foreground">Ganho Total</h3>
                    <p className="text-2xl sm:text-4xl font-bold text-green-500">{formatCurrencyInteger(hoursAndEarnings.totalEarnings)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-muted-foreground">Valor por Hora</h3>
                    <p className="text-2xl sm:text-4xl font-bold text-primary">{formatCurrencyInteger(hoursAndEarnings.hourlyRate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Distribuição de Horas por Dia</CardTitle>
                <CardDescription>
                  Como suas horas de trabalho estão distribuídas na semana
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={useMemo(() => {
                      // Criar um array com os dias da semana e inicializar horas como 0
                      const weekdayHoursData = WEEKDAYS.map(day => ({
                        name: day,
                        horas: 0,
                        corridas: 0,
                      }));
                      
                      // Calcular as horas trabalhadas por dia da semana
                      filteredTransactions.forEach(transaction => {
                        if (transaction.type === "income" && transaction.hoursWorked) {
                          const date = new Date(transaction.date);
                          const weekdayIndex = getDay(date);
                          weekdayHoursData[weekdayIndex].horas += transaction.hoursWorked;
                          weekdayHoursData[weekdayIndex].corridas += transaction.rides || 0;
                        }
                      });
                      
                      return weekdayHoursData;
                    }, [filteredTransactions])}
                    margin={{
                      top: 20,
                      right: isMobile ? 10 : 30,
                      left: isMobile ? 0 : 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      tickFormatter={(value) => isMobile ? value.substring(0, 3) : value}
                    />
                    <YAxis 
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      tickFormatter={(value) => `${value.toFixed(1)}h`}
                      width={isMobile ? 40 : 60}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'horas') {
                          return [`${value.toFixed(1)}h`, 'Horas Trabalhadas'];
                        }
                        return [value, 'Corridas'];
                      }}
                      cursor={{ fillOpacity: 0.2 }}
                    />
                    <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                    <Bar dataKey="horas" name="Horas" fill={COLORS.hours} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="corridas" name="Corridas" fill={COLORS.income} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ganhos por Plataforma */}
        <TabsContent value="platforms">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Ganhos por Plataforma</CardTitle>
                <CardDescription>
                  Comparação de ganhos entre as diferentes plataformas
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformEarnings}
                      cx="50%"
                      cy="50%"
                      labelLine={!isMobile}
                      outerRadius={isMobile ? 90 : 120}
                      innerRadius={isMobile ? 30 : 40}
                      paddingAngle={2}
                      fill="#8884d8"
                      dataKey={platformEarnings.some(p => p.valor > 0) ? "valor" : "minValue"}
                      nameKey="name"
                      label={isMobile ? undefined : (entry: any) => {
                        // Se tem minValue, mostramos R$ 0,00 para indicar que está zerado
                        if ('minValue' in entry) {
                          return `${entry.name}: R$ 0,00`;
                        }
                        return `${entry.name}: ${formatCurrency(entry.valor)}`;
                      }}
                    >
                      {platformEarnings.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => {
                        // Se o valor é minValue, mostramos 0
                        const entry = props.payload;
                        if (entry && 'minValue' in entry) {
                          return [formatCurrency(0), ''];
                        }
                        return [formatCurrency(value), ''];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Corridas por Plataforma</CardTitle>
                <CardDescription>
                  Número de corridas em cada plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={platformEarnings}
                    margin={{
                      top: 20,
                      right: isMobile ? 10 : 30,
                      left: isMobile ? 0 : 20,
                      bottom: 5,
                    }}
                    barGap={4}
                    barCategoryGap={16}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      tickFormatter={(value) => value.toString()}
                      width={isMobile ? 40 : 60}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        return [name === 'corridas' ? value.toString() : formatCurrency(value), 
                               name === 'corridas' ? 'Corridas' : 'Ganhos'];
                      }}
                      cursor={{ fillOpacity: 0.2 }}
                    />
                    <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                    <Bar dataKey="corridas" name="Corridas" fill={COLORS.hours} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="valor" name="Valor" fill={COLORS.income} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 