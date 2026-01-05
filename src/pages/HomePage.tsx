import { Link } from 'react-router-dom';
import { Camera, Palette, Box, Sparkles, FolderOpen, Settings, ArrowRight, Layers } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-full overflow-hidden">
      {/* Decorative background pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%238B4513' fill-opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Hero Section */}
      <section className="relative px-4 pt-6 pb-8 md:pt-10 md:pb-12 lg:pt-16 lg:pb-16 lg:px-8">
        <div
          className={`flex flex-col items-center text-center transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Logo */}
          <div className="relative mb-4 md:mb-6 lg:mb-8">
            <div
              className="absolute inset-0 blur-2xl bg-gradient-to-br from-terracotta/20 via-desert-sand/30 to-sienna/20 rounded-full scale-150"
            />
            <img
              src="/logo.png"
              alt="Relic AI"
              className="relative w-28 h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 object-contain drop-shadow-lg"
            />
          </div>

          {/* Title */}
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-sienna tracking-tight mb-3 lg:mb-4">
            {t('app.name')}
          </h1>

          {/* Tagline */}
          <p className="text-stone-gray text-base md:text-lg lg:text-xl max-w-md lg:max-w-2xl leading-relaxed">
            {t('app.tagline')}
          </p>

          {/* Decorative line */}
          <div className="flex items-center gap-3 mt-5 lg:mt-8">
            <div className="h-px w-12 lg:w-20 bg-gradient-to-r from-transparent to-desert-sand" />
            <div className="w-2 h-2 rotate-45 bg-terracotta/60" />
            <div className="h-px w-12 lg:w-20 bg-gradient-to-l from-transparent to-desert-sand" />
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="px-4 pb-8 lg:px-8 lg:pb-16">
        <div
          className={`transition-all duration-1000 ease-out delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="font-heading text-lg md:text-xl lg:text-2xl font-semibold text-charcoal mb-4 lg:mb-8 flex items-center gap-2 lg:gap-3">
            <span className="w-1 h-5 lg:h-6 bg-terracotta rounded-full" />
            {t('pages.home.chooseYourTool')}
          </h2>

          <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:gap-8">
            {/* Save The Past Card */}
            <Link
              to="/capture"
              className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-aged-paper to-parchment border border-desert-sand/80 p-5 md:p-6 lg:p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-sienna/10 hover:border-clay hover:-translate-y-1"
            >
              {/* Card background decoration */}
              <div className="absolute top-0 right-0 w-32 lg:w-48 h-32 lg:h-48 bg-gradient-to-bl from-terracotta/5 to-transparent rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-20 lg:w-32 h-20 lg:h-32 bg-gradient-to-tr from-sienna/5 to-transparent rounded-tr-full" />

              <div className="relative">
                {/* Icon cluster */}
                <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
                  <div className="flex items-center justify-center w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-gradient-to-br from-terracotta to-clay shadow-lg shadow-terracotta/20">
                    <Box className="w-6 h-6 lg:w-8 lg:h-8 text-bone-white" />
                  </div>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-sienna/10 flex items-center justify-center">
                      <Camera className="w-4 h-4 lg:w-5 lg:h-5 text-sienna" />
                    </div>
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-oxidized-bronze/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-oxidized-bronze" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-heading text-xl md:text-2xl lg:text-3xl font-bold text-sienna mb-2 lg:mb-3 group-hover:text-terracotta transition-colors">
                  {t('pages.home.saveThePast')}
                </h3>
                <p className="text-stone-gray text-sm md:text-base lg:text-lg leading-relaxed mb-4 lg:mb-6">
                  {t('pages.home.saveThePastDesc')}
                </p>

                {/* Features list */}
                <div className="flex flex-wrap gap-2 lg:gap-3 mb-4 lg:mb-6">
                  <span className="inline-flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full bg-sienna/10 text-sienna text-xs lg:text-sm font-medium">
                    <Box className="w-3 h-3 lg:w-4 lg:h-4" />
                    {t('pages.home.features.3dModels')}
                  </span>
                  <span className="inline-flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full bg-oxidized-bronze/10 text-oxidized-bronze text-xs lg:text-sm font-medium">
                    <Sparkles className="w-3 h-3 lg:w-4 lg:h-4" />
                    {t('pages.home.features.aiAnalysis')}
                  </span>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-terracotta font-medium text-sm lg:text-base group-hover:gap-3 transition-all rtl:flex-row-reverse">
                  {t('pages.home.startCapturing')}
                  <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
                </div>
              </div>
            </Link>

            {/* PastPalette Card */}
            <Link
              to="/capture?mode=colorize"
              className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-aged-paper to-parchment border border-desert-sand/80 p-5 md:p-6 lg:p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-desert-teal/10 hover:border-desert-teal/50 hover:-translate-y-1"
            >
              {/* Card background decoration */}
              <div className="absolute top-0 right-0 w-32 lg:w-48 h-32 lg:h-48 bg-gradient-to-bl from-desert-teal/5 to-transparent rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-20 lg:w-32 h-20 lg:h-32 bg-gradient-to-tr from-oxidized-bronze/5 to-transparent rounded-tr-full" />

              <div className="relative">
                {/* Icon with color swatches */}
                <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
                  <div className="flex items-center justify-center w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-gradient-to-br from-desert-teal to-oxidized-bronze shadow-lg shadow-desert-teal/20">
                    <Palette className="w-6 h-6 lg:w-8 lg:h-8 text-bone-white" />
                  </div>
                  <div className="flex -space-x-1 lg:-space-x-1.5">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-terracotta border-2 lg:border-3 border-parchment shadow-sm" />
                    <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gold-ochre border-2 lg:border-3 border-parchment shadow-sm" />
                    <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-oxidized-bronze border-2 lg:border-3 border-parchment shadow-sm" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-heading text-xl md:text-2xl lg:text-3xl font-bold text-desert-teal mb-2 lg:mb-3 group-hover:text-oxidized-bronze transition-colors">
                  {t('pages.home.pastPalette')}
                </h3>
                <p className="text-stone-gray text-sm md:text-base lg:text-lg leading-relaxed mb-4 lg:mb-6">
                  {t('pages.home.pastPaletteDesc')}
                </p>

                {/* Features list */}
                <div className="flex flex-wrap gap-2 lg:gap-3 mb-4 lg:mb-6">
                  <span className="inline-flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full bg-desert-teal/10 text-desert-teal text-xs lg:text-sm font-medium">
                    <Palette className="w-3 h-3 lg:w-4 lg:h-4" />
                    {t('pages.home.features.colorization')}
                  </span>
                  <span className="inline-flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full bg-gold-ochre/10 text-gold-ochre text-xs lg:text-sm font-medium">
                    <Layers className="w-3 h-3 lg:w-4 lg:h-4" />
                    {t('pages.home.features.multiStyle')}
                  </span>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-desert-teal font-medium text-sm lg:text-base group-hover:gap-3 transition-all rtl:flex-row-reverse">
                  {t('pages.home.restoreColors')}
                  <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Access & About - Side by side on desktop */}
      <section className="px-4 pb-8 lg:px-8 lg:pb-16">
        <div
          className={`grid gap-8 lg:grid-cols-5 lg:gap-12 transition-all duration-1000 ease-out delay-400 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Quick Access - Takes 2 columns on desktop */}
          <div className="lg:col-span-2">
            <h2 className="font-heading text-lg md:text-xl lg:text-2xl font-semibold text-charcoal mb-4 lg:mb-6 flex items-center gap-2 lg:gap-3">
              <span className="w-1 h-5 lg:h-6 bg-oxidized-bronze rounded-full" />
              {t('pages.home.quickAccess')}
            </h2>

            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-1 lg:gap-4">
              <Link
                to="/gallery"
                className="group flex items-center gap-3 lg:gap-4 rounded-xl lg:rounded-2xl bg-aged-paper/80 backdrop-blur-sm border border-desert-sand/60 p-4 lg:p-5 transition-all duration-200 hover:bg-aged-paper hover:border-clay hover:shadow-md"
              >
                <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-sienna/10 group-hover:bg-sienna/20 transition-colors">
                  <FolderOpen className="w-5 h-5 lg:w-6 lg:h-6 text-sienna" />
                </div>
                <div className="min-w-0">
                  <span className="block font-medium text-charcoal text-sm md:text-base lg:text-lg truncate">{t('nav.gallery')}</span>
                  <span className="block text-xs lg:text-sm text-stone-gray truncate">{t('pages.home.viewYourArtifacts')}</span>
                </div>
                <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 text-stone-gray/50 ltr:ml-auto rtl:mr-auto hidden lg:block group-hover:text-sienna group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all rtl:rotate-180" />
              </Link>

              <Link
                to="/settings"
                className="group flex items-center gap-3 lg:gap-4 rounded-xl lg:rounded-2xl bg-aged-paper/80 backdrop-blur-sm border border-desert-sand/60 p-4 lg:p-5 transition-all duration-200 hover:bg-aged-paper hover:border-clay hover:shadow-md"
              >
                <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-stone-gray/10 group-hover:bg-stone-gray/20 transition-colors">
                  <Settings className="w-5 h-5 lg:w-6 lg:h-6 text-stone-gray" />
                </div>
                <div className="min-w-0">
                  <span className="block font-medium text-charcoal text-sm md:text-base lg:text-lg truncate">{t('nav.settings')}</span>
                  <span className="block text-xs lg:text-sm text-stone-gray truncate">{t('pages.home.preferencesConfig')}</span>
                </div>
                <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 text-stone-gray/50 ltr:ml-auto rtl:mr-auto hidden lg:block group-hover:text-stone-gray group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all rtl:rotate-180" />
              </Link>
            </div>
          </div>

          {/* About/Info Section - Takes 3 columns on desktop */}
          <div className="lg:col-span-3">
            <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-r from-sienna/5 via-aged-paper to-desert-sand/10 border border-desert-sand/40 p-5 md:p-6 lg:p-8 h-full">
              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-24 lg:w-40 h-24 lg:h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full text-sienna/10">
                  <path d="M100 0 L100 100 L0 100 Z" fill="currentColor" />
                </svg>
              </div>

              <div className="relative">
                <h3 className="font-heading text-base md:text-lg lg:text-xl font-semibold text-sienna mb-2 lg:mb-4">
                  {t('pages.home.preservingHistory')}
                </h3>
                <p className="text-stone-gray text-sm lg:text-base leading-relaxed max-w-lg lg:max-w-none">
                  {t('pages.home.aboutDescription')}
                </p>

                {/* Stats or highlights */}
                <div className="flex flex-wrap gap-4 md:gap-6 lg:gap-8 mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-desert-sand/40">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-terracotta" />
                    <span className="text-xs lg:text-sm text-stone-gray">{t('pages.home.highlights.aiPowered')}</span>
                  </div>
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-desert-teal" />
                    <span className="text-xs lg:text-sm text-stone-gray">{t('pages.home.highlights.offlineFirst')}</span>
                  </div>
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-oxidized-bronze" />
                    <span className="text-xs lg:text-sm text-stone-gray">{t('pages.home.highlights.openSource')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom spacing */}
      <div className="h-4 md:h-8 lg:h-12" />
    </div>
  );
}
