import { useState, useEffect } from 'react';
import { CreditCard, Download, CheckCircle2 } from 'lucide-react';
import { TopNav } from '../components/TopNav';
import { useUserCredits } from '../hooks/useUserCredits';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
}

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  type: 'purchase' | 'refund' | 'usage';
  description: string;
}

const creditPacks: CreditPack[] = [
  { id: 'starter', name: 'Starter', credits: 10, price: 9 },
  { id: 'creator', name: 'Creator', credits: 30, price: 24, popular: true },
  { id: 'pro', name: 'Pro', credits: 100, price: 69 },
  { id: 'agency', name: 'Agency', credits: 300, price: 179 },
];

export function BillingPage() {
  useUserCredits();

  const { user } = useAuth();
  const { credits } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          amount: -3,
          type: 'usage',
          description: 'Final render (3 variants)',
        },
        {
          id: '2',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          amount: -1,
          type: 'usage',
          description: 'Preview render',
        },
        {
          id: '3',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          amount: 30,
          type: 'purchase',
          description: 'Purchased Creator Pack',
        },
        {
          id: '4',
          created_at: new Date(Date.now() - 604800000).toISOString(),
          amount: 50,
          type: 'purchase',
          description: 'Sign-up bonus',
        },
      ];
      setTransactions(mockTransactions);
    };

    fetchTransactions();
  }, [user]);

  const handlePurchase = async () => {
    setIsLoading(true);
    alert('Stripe integration pending. In production, this would redirect to Stripe Checkout.');
    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Billing & Credits</h1>

        <div className="mb-12 p-6 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Current Balance</p>
              <p className="text-5xl font-bold text-white">{credits}</p>
              <p className="text-slate-400 text-sm mt-2">credits available</p>
            </div>
            <div className="text-right">
              <div className="space-y-2 text-sm text-slate-400">
                <p>1 credit = 1 preview (8-10s)</p>
                <p>3 credits = 1 final video (20-24s)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Purchase Credits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {creditPacks.map((pack) => (
              <div
                key={pack.id}
                className={`relative bg-slate-900 border rounded-xl p-6 hover:border-slate-600 transition-all ${
                  pack.popular ? 'border-blue-500' : 'border-slate-800'
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{pack.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-white">${pack.price}</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-2">{pack.credits} credits</p>
                  <p className="text-slate-500 text-xs mt-1">
                    ${(pack.price / pack.credits).toFixed(2)} per credit
                  </p>
                </div>

                <button
                  onClick={() => handlePurchase()}
                  disabled={isLoading}
                  className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    pack.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <CreditCard size={18} />
                  Purchase
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Transaction History</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                No transactions yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Credits
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                              transaction.type === 'purchase'
                                ? 'bg-green-500/10 text-green-400'
                                : transaction.type === 'refund'
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {transaction.type === 'purchase' && <CheckCircle2 size={12} />}
                            {transaction.type === 'usage' && <Download size={12} />}
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <span
                            className={
                              transaction.amount > 0
                                ? 'text-green-400'
                                : 'text-slate-400'
                            }
                          >
                            {transaction.amount > 0 ? '+' : ''}
                            {transaction.amount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
