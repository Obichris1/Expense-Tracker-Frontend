

<!-- Search query state -->
const [searchQuery, setSearchQuery] = useState("");


// <!-- Debounce helper -->

function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
) {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}


<!-- Debounced search handler -->
const debouncedSearch = useMemo(
  () =>
    debounce((value: string) => {
      setPage(1);
      setSearchQuery(value);
    }, 500),
  []
);




const { data: transactionsData, isLoading } =
  useQuery<ApiResponse<PaginatedTransactions>>({
    queryKey: ["transactions", searchQuery, page, limit],
    queryFn: () =>
      getTransactions({
        s: searchQuery || undefined,
        page,
        limit,
      }),
    placeholderData: (prev) => prev,
  });


  

const filteredTransactions = useMemo(() => {
  if (!startDate && !endDate) return transactions;

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start && Number.isNaN(start.getTime())) return transactions;
  if (end && Number.isNaN(end.getTime())) return transactions;

  if (end) {
    end.setHours(23, 59, 59, 999);
  }

  return transactions.filter((transaction) => {
    const date = new Date(transaction.createdAt);

    if (Number.isNaN(date.getTime())) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;

    return true;
  });
}, [transactions, startDate, endDate]);


