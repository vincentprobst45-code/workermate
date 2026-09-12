'use client';

import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ForecastBudgetPointDetails, { type ForecastLine } from './ForecastBudgetPointDetails';

export interface ForecastPoint {
  date: string;
  currency: string;
  openingBalance: number;
  inflows: number;
  outflows: number;
  closingBalance: number;
  lines: ForecastLine[];
}

interface ForecastBudgetGraphProps {
  points: ForecastPoint[];
  emptyReason?: string;
}

function money(value: number, currency: string) {
  const normalizedCurrency = currency?.trim().toUpperCase() || 'EUR';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: normalizedCurrency, maximumFractionDigits: 0 }).format(value);
}

interface ForecastTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: ForecastPoint; value?: number | string }>;
}

function ForecastTooltip({ active, payload }: ForecastTooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  const lines = Array.isArray(point.lines) ? point.lines : [];
  return <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg"><p className="font-semibold text-slate-900">{new Date(point.date).toLocaleDateString('fr-FR')}</p><p className="text-sky-700">Solde projeté : {money(point.closingBalance, point.currency)}</p><p className="text-slate-500">{lines.length === 0 ? 'Aucun flux prévu à cette date.' : `${lines.length} flux prévu(s) à cette date.`}</p></div>;
}

export default function ForecastBudgetGraph({ points, emptyReason }: ForecastBudgetGraphProps) {
  const [selectedPoint, setSelectedPoint] = useState<ForecastPoint | null>(null);
  const currencies = [...new Set(points.map((point) => point.currency))];
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">Prévision de trésorerie</h2><p className="text-sm text-slate-500">Cliquez sur un point pour afficher les sources détaillées.</p></div><div className="flex gap-2">{currencies.map((currency) => <span key={currency} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{currency}</span>)}</div></div><div className="mt-5 h-72 w-full">{points.length === 0 ? <div className="flex h-full flex-col items-center justify-center rounded-xl bg-slate-50 px-6 text-center"><p className="font-semibold text-slate-700">Aucune projection disponible</p><p className="mt-2 max-w-xl text-sm text-slate-500">{emptyReason || 'Le serveur n’a pas fourni de raison détaillée.'}</p></div> : <ResponsiveContainer width="100%" height="100%"><LineChart data={points}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} stroke="#64748b" fontSize={12} /><YAxis tickFormatter={(value) => String(Math.round(value))} stroke="#64748b" fontSize={12} /><Tooltip content={<ForecastTooltip />} /><Line type="monotone" dataKey="closingBalance" stroke="#0284c7" strokeWidth={3} dot={(dotProps) => { const props = dotProps as { cx?: number; cy?: number; payload?: ForecastPoint }; if (props.cx === undefined || props.cy === undefined) return null; return <circle cx={props.cx} cy={props.cy} r={5} fill="#0284c7" stroke="#fff" strokeWidth={2} style={{ cursor: 'pointer' }} onClick={() => { if (props.payload) setSelectedPoint(props.payload); }} />; }} activeDot={(dotProps) => { const props = dotProps as { cx?: number; cy?: number; payload?: ForecastPoint }; if (props.cx === undefined || props.cy === undefined) return null; return <circle cx={props.cx} cy={props.cy} r={7} fill="#0284c7" stroke="#fff" strokeWidth={2} style={{ cursor: 'pointer' }} onClick={() => { if (props.payload) setSelectedPoint(props.payload); }} />; }} /></LineChart></ResponsiveContainer>}</div>{selectedPoint && <div className="mt-5"><ForecastBudgetPointDetails point={selectedPoint} onClose={() => setSelectedPoint(null)} /></div>}</section>;
}
