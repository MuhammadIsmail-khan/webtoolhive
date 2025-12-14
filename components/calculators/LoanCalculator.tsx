import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, DollarSign } from 'lucide-react';

const LoanCalculator: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [years, setYears] = useState('');
  const [result, setResult] = useState<{ emi: string, totalInterest: string, totalPayment: string } | null>(null);

  const calculateLoan = () => {
    const p = parseFloat(amount);
    const r = parseFloat(rate) / 12 / 100;
    const n = parseFloat(years) * 12;

    if (p && r && n) {
      const emiVal = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const totalPaymentVal = emiVal * n;
      const totalInterestVal = totalPaymentVal - p;

      setResult({
        emi: emiVal.toFixed(2),
        totalInterest: totalInterestVal.toFixed(2),
        totalPayment: totalPaymentVal.toFixed(2)
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-6 lg:px-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 text-center">
          <Link to="/" className="inline-flex items-center text-[#475569] hover:text-[#059669] transition-colors mb-4 font-medium">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-[#0F172A] flex items-center justify-center gap-3">
            <DollarSign className="w-10 h-10 text-[#059669]" />
            Loan Calculator
          </h1>
          <p className="text-lg text-[#64748B] mt-3">Estimate your monthly loan payments.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-[#E5E7EB] p-8 md:p-12">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">Loan Amount</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-[#059669] outline-none" placeholder="e.g. 50000" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">Interest Rate (%)</label>
              <input type="number" value={rate} onChange={e => setRate(e.target.value)} className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-[#059669] outline-none" placeholder="e.g. 5.5" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">Loan Term (Years)</label>
              <input type="number" value={years} onChange={e => setYears(e.target.value)} className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-[#059669] outline-none" placeholder="e.g. 5" />
            </div>

            <button onClick={calculateLoan} className="w-full bg-[#059669] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#047857] transition-all">
              Calculate EMI
            </button>
          </div>

          {result && (
            <div className="mt-8 bg-[#F0FDFA] rounded-2xl p-6 border border-teal-100 animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-teal-800 font-semibold mb-1">Monthly Payment</div>
                  <div className="text-3xl font-bold text-[#0F172A]">${result.emi}</div>
                </div>
                <div>
                   <div className="text-sm text-teal-800 font-semibold mb-1">Total Interest</div>
                   <div className="text-xl font-bold text-[#059669]">${result.totalInterest}</div>
                </div>
                <div className="md:col-span-2 pt-4 border-t border-teal-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#0F172A]">Total Amount Payable</span>
                    <span className="font-bold text-xl text-[#0F172A]">${result.totalPayment}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanCalculator;