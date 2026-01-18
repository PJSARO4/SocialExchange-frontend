'use client';

interface Props {
  snapshot: {
    fundsRaised: number;
    investmentGains: number;
    tradingProfit: number;
  };
}

export default function FinancialSnapshotPanel({ snapshot }: Props) {
  return (
    <div className="panel panel-financial-snapshot">
      <div className="panel-header">
        <h2 className="panel-title">Financial Snapshot</h2>
      </div>
      <div className="panel-body">
        <div className="financial-metric">
          <div className="financial-metric-label">Funds Raised</div>
          <div className="financial-metric-value funds-raised">
            ${snapshot.fundsRaised.toLocaleString()}
          </div>
        </div>
        <div className="financial-metric">
          <div className="financial-metric-label">Investment Gains</div>
          <div className="financial-metric-value investment-gains">
            ${snapshot.investmentGains.toLocaleString()}
          </div>
        </div>
        <div className="financial-metric">
          <div className="financial-metric-label">Trading Profit</div>
          <div className="financial-metric-value trading-profit">
            ${snapshot.tradingProfit.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
