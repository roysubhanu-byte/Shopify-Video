import { CreditCard, Check } from 'lucide-react';
import { useStore } from '../store/useStore';

export function BillingPage() {
  const credits = useStore((state) => state.credits);

  const plans = [
    {
      name: 'Starter',
      price: '$29',
      credits: 10,
      features: [
        '10 video generations',
        'All 3 concept variants',
        'HD quality (1080p)',
        'Basic support',
      ],
    },
    {
      name: 'Pro',
      price: '$99',
      credits: 50,
      features: [
        '50 video generations',
        'All 3 concept variants',
        'HD quality (1080p)',
        'Priority support',
        'Custom brand kit',
        'API access',
      ],
      popular: true,
    },
    {
      name: 'Agency',
      price: '$299',
      credits: 200,
      features: [
        '200 video generations',
        'All 3 concept variants',
        'HD quality (1080p)',
        'Dedicated support',
        'Custom brand kit',
        'API access',
        'White-label option',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Simple, Credit-Based Pricing
          </h1>
          <p className="text-xl text-slate-400">
            You currently have <span className="text-blue-400 font-bold">{credits} credits</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-slate-800 border-2 rounded-2xl p-8 relative ${
                plan.popular
                  ? 'border-blue-500'
                  : 'border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold text-white mb-2">
                {plan.name}
              </h3>

              <div className="mb-6">
                <span className="text-5xl font-bold text-white">{plan.price}</span>
                <span className="text-slate-400 ml-2">/ {plan.credits} credits</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-slate-300">
                    <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                <CreditCard size={20} />
                Buy Credits
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 p-8 bg-slate-800 border border-slate-700 rounded-xl">
          <h3 className="text-xl font-bold text-white mb-4">How Credits Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-300">
            <div>
              <div className="text-blue-400 font-bold text-2xl mb-2">0 credits</div>
              <p>Preview generation is free. Test unlimited concepts.</p>
            </div>
            <div>
              <div className="text-blue-400 font-bold text-2xl mb-2">3 credits</div>
              <p>Final render creates 3 HD videos (one per concept variant).</p>
            </div>
            <div>
              <div className="text-blue-400 font-bold text-2xl mb-2">Never expire</div>
              <p>Credits stay in your account forever. Use them when you need.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
