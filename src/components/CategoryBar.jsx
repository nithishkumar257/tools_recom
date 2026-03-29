import { FiGrid, FiCode, FiEdit3, FiPenTool, FiTrendingUp, FiSearch, FiVideo, FiBriefcase, FiHeadphones, FiZap, FiMic, FiDatabase, FiBookOpen, FiHeart, FiDollarSign, FiBox, FiShield, FiGlobe } from 'react-icons/fi';
import './CategoryBar.css';

const iconMap = {
  All: FiGrid,
  Coding: FiCode,
  Writing: FiEdit3,
  Design: FiPenTool,
  Marketing: FiTrendingUp,
  Research: FiSearch,
  Video: FiVideo,
  Productivity: FiBriefcase,
  Support: FiHeadphones,
  Automation: FiZap,
  Audio: FiMic,
  Data: FiDatabase,
  Education: FiBookOpen,
  Healthcare: FiHeart,
  Finance: FiDollarSign,
  '3D & Spatial': FiBox,
  Security: FiShield,
  Translation: FiGlobe,
};

export default function CategoryBar({ categories, activeCategory, onChange }) {
  return (
    <div className="category-bar">
      {categories.map((category) => {
        const Icon = iconMap[category] || FiGrid;
        return (
          <button
            key={category}
            type="button"
            className={`cat-btn ${activeCategory === category ? 'active' : ''}`}
            onClick={() => onChange(category)}
          >
            <Icon />
            <span>{category}</span>
          </button>
        );
      })}
    </div>
  );
}
