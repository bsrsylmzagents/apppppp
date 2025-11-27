import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown,
  Wallet
} from 'lucide-react';

const Cash = () => {
  const navigate = useNavigate();

  const cashMenuItems = [
    { 
      id: 'income',
      title: 'Gelir', 
      icon: TrendingUp, 
      path: '/cash/income',
      description: 'Gelir kayıtları, kategoriler ve istatistikler'
    },
    { 
      id: 'expense',
      title: 'Gider', 
      icon: TrendingDown, 
      path: '/cash/expense',
      description: 'Gider kayıtları, kategoriler ve istatistikler'
    },
    { 
      id: 'detail',
      title: 'Kasa Detay', 
      icon: Wallet, 
      path: '/cash/detail',
      description: 'Döviz durumu, kur yönetimi ve işlem geçmişi'
    },
  ];

  return (
    <div className="space-y-6" data-testid="cash-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Kasa</h1>
        <p className="text-muted-foreground">Gelir, gider ve kasa yönetimi</p>
      </div>

      {/* Cash Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cashMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              className="bg-card backdrop-blur-xl border border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 hover:bg-muted transition-all group"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-muted border border-primary/20 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-muted/80 transition-all">
                  <Icon size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground leading-tight mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Cash;
