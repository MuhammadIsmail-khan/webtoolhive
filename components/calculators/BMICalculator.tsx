import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, RefreshCw } from 'lucide-react';

const BMICalculator: React.FC = () => {
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('');

  const calculateBMI = () => {
    if (!weight || !height) return;
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // Convert cm to m
    if (w > 0 && h > 0) {
      const bmiValue = w / (h * h);
      setBmi(parseFloat(bmiValue.toFixed(1)));

      if (bmiValue < 18.5) setCategory('Underweight');
      else if (bmiValue < 25) setCategory('Normal weight');
      else if (bmiValue < 30) setCategory('Overweight');
      else setCategory('Obese');
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Underweight': return 'text-blue-500 bg-blue-50';
      case 'Normal weight': return 'text-green-500 bg-green-50';
      case 'Overweight': return 'text-orange-500 bg-orange-50';
      case 'Obese': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500';
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
            <Activity className="w-10 h-10 text-[#059669]" />
            BMI Calculator
          </h1>
          <p className="text-lg text-[#64748B] mt-3">Calculate your Body Mass Index instantly.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-[#E5E7EB] p-8 md:p-12">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-[#059669] outline-none"
                placeholder="e.g. 70"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-2">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-[#059669] outline-none"
                placeholder="e.g. 175"
              />
            </div>

            <button
              onClick={calculateBMI}
              className="w-full bg-[#059669] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#047857] transition-all"
            >
              Calculate BMI
            </button>
          </div>

          {bmi !== null && (
            <div className="mt-8 text-center animate-fade-in-up">
              <div className="text-sm text-[#64748B] uppercase tracking-wider font-semibold">Your BMI</div>
              <div className="text-5xl font-bold text-[#0F172A] my-2">{bmi}</div>
              <div className={`inline-block px-4 py-2 rounded-full font-bold text-sm ${getCategoryColor(category)}`}>
                {category}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BMICalculator;