'use client';

interface PriceSignal {
  asset: string;
  current: number;
  delta: number;
  direction: 'up' | 'down';
}

interface Props {
  signals: PriceSignal[];
}

export default function PriceSignalsPanel({ signals }: Props) {
  const displaySignals =
    signals.length === 0
      ? [
          {
            asset: '—',
            current: 0,
            delta: 0,
            direction: 'up' as const
          }
        ]
      : signals;

  return (
    <div className="panel panel-price-signals">
      <div className="panel-header">
        <h2 className="panel-title">Price Signals</h2>
      </div>

      <div className="panel-body">
        {displaySignals.map((signal, idx) => (
          <div key={idx} className="price-signal-item">
            <div className="price-signal-asset">
              {signal.asset === '—' ? 'Awaiting signals…' : signal.asset}
            </div>

            <div className="price-signal-data">
              <span className="price-signal-current">
                {signal.asset === '—' ? '—' : `$${signal.current}`}
              </span>

              <span className={`price-signal-delta ${signal.direction}`}>
                {signal.asset === '—'
                  ? ''
                  : `${signal.direction === 'up' ? '+' : ''}${signal.delta}%`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
