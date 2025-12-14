import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';

const AgeCalculator: React.FC = () => {
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState<{ years: number, months: number, days: number } | null>(null);

  const calculateAge = () => {
    if (!birthDate) return;
    
    const today = new Date();
    const birth = new Date(birthDate);
    
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (months < 0 || (months === 0 && days < 0)) {
      years--;
      months += 12;
    }
    if (days < 0) {
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
      months--;
    }

    setAge({ years, months, days });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-6 lg:px-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 text-center">
          <Link to="/" className="inline-flex items-center text-[#475569] hover:text-[#059669] transition-colors mb-4 font-medium">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-[#0F172A] flex items-center justify-center gap-3">
            <Calendar className="w-10 h-10 text-[#059669]" />
            Age Calculator
          </h1>
          <p className="text-lg text-[#64748B] mt-3">Find out exactly how old you are.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-[#E5E7EB] p-8 md:p-12">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">Date of Birth</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-[#059669] outline-none text-[#0F172A]"
              />
            </div>
            
            <button
              onClick={calculateAge}
              className="w-full bg-[#059669] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#047857] transition-all"
            >
              Calculate Age
            </button>
          </div>

          {age && (
            <div className="mt-8 grid grid-cols-3 gap-4 animate-fade-in-up text-center">
               <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <div className="text-3xl font-bold text-[#059669]">{age.years}</div>
                  <div className="text-xs font-semibold text-emerald-800 uppercase mt-1">Years</div>
               </div>
               <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <div className="text-3xl font-bold text-blue-600">{age.months}</div>
                  <div className="text-xs font-semibold text-blue-800 uppercase mt-1">Months</div>
               </div>
               <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                  <div className="text-3xl font-bold text-purple-600">{age.days}</div>
                  <div className="text-xs font-semibold text-purple-800 uppercase mt-1">Days</div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgeCalculator;