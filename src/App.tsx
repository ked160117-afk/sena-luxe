/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LineInquiryModal } from './components/LineInquiryModal';
import { FloatingLineButton } from './components/FloatingLineButton';

import { TopView } from './views/TopView';
import { GamesView } from './views/GamesView';
import { GameProductsView } from './views/GameProductsView';
import { RetiredAccountsView } from './views/RetiredAccountsView';
import { StoneRatesView } from './views/StoneRatesView';
import { CandidatesView } from './views/CandidatesView';
import { RequestView } from './views/RequestView';
import { FaqNoticeView } from './views/FaqNoticeView';
import { ShopInfoView, TermsView, PrivacyView, LawView } from './views/LegalViews';
import { AdminLoginView } from './views/AdminLoginView';
import { AdminDashboardView } from './views/AdminDashboardView';

const MainContent: React.FC = () => {
  const { currentView, isAdminLoggedIn } = useStore();

  const renderView = () => {
    switch (currentView) {
      case 'top':
        return <TopView />;
      case 'games':
        return <GamesView />;
      case 'game_products':
        return <GameProductsView />;
      case 'retired_accounts':
        return <RetiredAccountsView />;
      case 'stone_rates':
        return <StoneRatesView />;
      case 'candidates':
        return <CandidatesView />;
      case 'request':
        return <RequestView />;
      case 'faq':
        return <FaqNoticeView />;
      case 'shop_info':
        return <ShopInfoView />;
      case 'terms':
        return <TermsView />;
      case 'privacy':
        return <PrivacyView />;
      case 'law':
        return <LawView />;
      case 'admin_login':
        return <AdminLoginView />;
      case 'admin_dashboard':
        return isAdminLoggedIn ? <AdminDashboardView /> : <AdminLoginView />;
      default:
        return <TopView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c0e] text-[#f4efe6]">
      <Navbar />
      <main className="flex-1">
        {renderView()}
      </main>
      <Footer />
      <LineInquiryModal />
      <FloatingLineButton />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainContent />
    </StoreProvider>
  );
}
