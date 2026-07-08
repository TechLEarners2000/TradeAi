import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, LineStyle } from 'lightweight-charts';
import { PredictionPoint } from '../../services/api';

interface Props {
  historical: number[];
  prediction: PredictionPoint[];
  symbol: string;
}

export default function StockChart({ historical, prediction, symbol }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#1f1f21' },
        textColor: '#c6c6cd',
      },
      grid: {
        vertLines: { color: '#353436' },
        horzLines: { color: '#353436' },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: '#45464d',
      },
      timeScale: {
        borderColor: '#45464d',
        timeVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: 380,
    });

    chartRef.current = chart;

    const histData = historical.map((price, i) => ({
      time: (Math.floor(Date.now() / 1000) - (historical.length - i) * 86400) as any,
      value: price,
    }));

    const histSeries = chart.addLineSeries({
      color: '#4edea3',
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });
    histSeries.setData(histData);

    if (prediction.length > 0) {
      const predData = prediction.map((p, i) => ({
        time: (Math.floor(Date.now() / 1000) + (i + 1) * 86400) as any,
        value: p.price,
      }));

      const predSeries = chart.addLineSeries({
        color: '#c0c1ff',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });
      predSeries.setData(predData);

      const bandData = prediction.map((p, i) => ({
        time: (Math.floor(Date.now() / 1000) + (i + 1) * 86400) as any,
        value: p.upperBand,
      }));
      const lowerData = prediction.map((p, i) => ({
        time: (Math.floor(Date.now() / 1000) + (i + 1) * 86400) as any,
        value: p.lowerBand,
      }));

      const bandSeries = chart.addLineSeries({
        color: '#c0c1ff',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
      });
      bandSeries.setData(bandData);
    }

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [historical, prediction, symbol]);

  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant p-4 h-[480px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-headline-sm">Stock Analysis</h3>
          <div className="flex bg-surface-container-highest rounded-lg p-0.5">
            {['1D', '1W', '1M', '1Y', '5Y'].map(p => (
              <button key={p} className={`px-3 py-1 text-data-sm ${p === '1M' ? 'bg-primary-container text-primary rounded shadow-sm' : 'text-on-surface'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-secondary rounded-full" />
            <span className="text-body-sm text-on-surface-variant">Historical</span>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <span className="w-3 h-3 border-2 border-dashed border-tertiary rounded-full" />
            <span className="text-body-sm text-tertiary">AI Prediction</span>
          </div>
        </div>
      </div>
      <div ref={containerRef} className="flex-1" />
    </div>
  );
}
