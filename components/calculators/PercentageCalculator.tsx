import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Percent } from 'lucide-react';

const PercentageCalculator: React.FC = () => {
  const [val1, setVal1] = useState('');
  const [val2, setVal2] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [mode, setMode] = useState<'value' | 'percent' | 'change'>('value');

  const calculate = () => {
    const v1 = parseFloat(val1);
    const v2 = parseFloat(val2);
    if (isNaN(v1) || isNaN(v2)) return;

    let res = 0;
    if (mode === 'value') {
      // What is X% of Y?
      res = (v1 / 100) * v2;
    } else if (mode === 'percent') {
      // X is what % of Y?
      res = (v1 / v2) * 100;
    } else {
      // % change from X to Y
      res = ((v2 - v1) / v1) * 100;
    }
    setResult(res.toFixed(2));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-6 lg:px-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 text-center">
          <Link to="/" className="inline-flex items-center text-[#475569] hover:text-[#059669] transition-colors mb-4 font-medium">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-[#0F172A] flex items-center justify-center gap-3">
            <Percent className="w-10 h-10 text-[#059669]" />
            Percentage Calculator
          </h1>
          <p className="text-lg text-[#64748B] mt-3">Solve common percentage problems easily.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-[#E5E7EB] p-8 md:p-12">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 bg-gray-50 p-2 rounded-xl">
             <button onClick={() => { setMode('value'); setResult(null); }} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${mode === 'value' ? 'bg-white shadow text-[#059669]' : 'text-[#64748B] hover:bg-gray-200'}`}>% Value</button>
             <button onClick={() => { setMode('percent'); setResult(null); }} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${mode === 'percent' ? 'bg-white shadow text-[#059669]' : 'text-[#64748B] hover:bg-gray-200'}`}>What % is?</button>
             <button onClick={() => { setMode('change'); setResult(null); }} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${mode === 'change' ? 'bg-white shadow text-[#059669]' : 'text-[#64748B] hover:bg-gray-200'}`}>% Change</button>
          </div>

          <div className="space-y-6">
            {mode === 'value' && (
               <div className="flex items-center gap-4 text-xl">
                 <span>What is</span>
                 <input type="number" value={val1} onChange={e => setVal1(e.target.value)} className="w-24 border-b-2 border-[#059669] text-center focus:outline-none py-1" placeholder="15" />
                 <span>% of</span>
                 <input type="number" value={val2} onChange={e => setVal2(e.target.value)} className="w-24 border-b-2 border-[#059669] text-center focus:outline-none py-1" placeholder="200" />
                 <span>?</span>
               </div>
            )}
            {mode === 'percent' && (
               <div className="flex items-center gap-4 text-xl">
                 <input type="number" value={val1} onChange={e => setVal1(e.target.value)} className="w-24 border-b-2 border-[#059669] text-center focus:outline-none py-1" placeholder="25" />
                 <span>is what % of</span>
                 <input type="number" value={val2} onChange={e => setVal2(e.target.value)} className="w-24 border-b-2 border-[#059669] text-center focus:outline-none py-1" placeholder="100" />
                 <span>?</span>
               </div>
            )}
            {mode === 'change' && (
               <div className="flex items-center gap-4 text-xl flex-wrap">
                 <span>Change from</span>
                 <input type="number" value={val1} onChange={e => setVal1(e.target.value)} className="w-24 border-b-2 border-[#059669] text-center focus:outline-none py-1" placeholder="100" />
                 <span>to</span>
                 <input type="number" value={val2} onChange={e => setVal2(e.target.value)} className="w-24 border-b-2 border-[#059669] text-center focus:outline-none py-1" placeholder="150" />
                 <span>?</span>
               </div>
            )}

            <button onClick={calculate} className="w-full bg-[#059669] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#047857] transition-all mt-4">
              Calculate
            </button>
          </div>

          {result && (
            <div className="mt-8 text-center animate-fade-in-up">
              <div className="text-sm text-[#64748B] uppercase tracking-wider font-semibold">Result</div>
              <div className="text-5xl font-bold text-[#0F172A] my-2">{result}%</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PercentageCalculator;