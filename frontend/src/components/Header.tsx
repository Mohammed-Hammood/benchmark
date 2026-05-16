import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

export default function Header() {
    const { i18n, t } = useTranslation();
    const { theme, toggleTheme } = useTheme();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'ru' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <header className="bg-teal-dark text-white sticky top-0 z-50 shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                {/* Left: Nav Links */}
                <div className="flex space-x-6">
                    <Link to="/" className="font-medium hover:text-teal-light transition">{t("Home")}</Link>
                    <Link to="/about" className="font-medium hover:text-teal-light transition">{t("About")}</Link>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center space-x-3">
                    {/* Language Toggle */}
                    <button
                        onClick={toggleLanguage}
                        className="text-sm font-mono bg-teal-light hover:bg-teal-600 px-2 py-1 rounded cursor-pointer"
                        aria-label="Toggle language"
                    >
                        {i18n.language === 'en' ? 'RU' : 'EN'}
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-8 h-8 flex items-center justify-center bg-teal-light hover:bg-teal-600 rounded-full cursor-pointer"
                        aria-label="Toggle dark mode"
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>
            </div>
        </header>
    );
}