import React, { useState } from 'react';
import { BookOpen, Building, Sun, TreeDeciduous, Wind, Flame, ShieldAlert, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

const LearnPage = () => {
  const [expandedCause, setExpandedCause] = useState('c1');

  const causes = [
    {
      id: 'c1',
      title: 'Concrete & Dark Asphalt Surfaces',
      icon: Building,
      summary: 'Asphalt roads and concrete pavements have high solar absorptance.',
      details: 'Dark urban paving materials absorb up to 90% of incoming solar thermal energy, storing immense heat during daylight hours and releasing it back into the surface boundary layer throughout the evening.'
    },
    {
      id: 'c2',
      title: 'Dense High-Rise Building Architecture',
      icon: Sun,
      summary: 'Narrow urban canyons trap thermal radiation between vertical walls.',
      details: 'Vertical building walls reflect sunlight back and forth, preventing radiative cooling to the upper sky dome. This phenomenon is known as the urban canyon effect.'
    },
    {
      id: 'c3',
      title: 'Reduced Natural Tree Vegetation',
      icon: TreeDeciduous,
      summary: 'Replacing natural green canopy cuts off evapotranspiration cooling.',
      details: 'Trees act as natural air conditioners through evapotranspiration, converting liquid water to vapor using ambient heat. Removing vegetation eliminates this key cooling mechanism.'
    },
    {
      id: 'c4',
      title: 'Anthropogenic & Industrial Waste Heat',
      icon: Flame,
      summary: 'Vehicular exhausts, AC condensers, and industrial operations.',
      details: 'Air conditioning units dump warm air directly into street corridors while vehicular combustion adds waste thermal energy directly into pedestrian spaces.'
    },
    {
      id: 'c5',
      title: 'Stagnant Wind Airflow',
      icon: Wind,
      summary: 'Densely packed structures block natural ventilation breezes.',
      details: 'Tall, clustered building footprints impede regional wind vectors, preventing stagnant hot air pockets from dispersing out of commercial districts.'
    }
  ];

  const solutions = [
    { title: 'Plant Urban Trees & Canopies', desc: 'Provides direct shade to ground surfaces and cools ambient air via evapotranspiration.', icon: TreeDeciduous },
    { title: 'Develop Community Parks', desc: 'Creates urban green oases that act as local cooling islands for surrounding blocks.', icon: TreeDeciduous },
    { title: 'Install Cool High-Albedo Roofs', desc: 'Reflective solar roofs prevent buildings from absorbing overhead thermal radiation.', icon: Building },
    { title: 'Use Permeable Pavements', desc: 'Allows rainwater infiltration to naturally cool ground surfaces through evaporation.', icon: Wind },
  ];

  return (
    <div className="page-container learn-page">
      <div className="page-header">
        <h1 className="page-title">Learn About Urban Heat Islands</h1>
        <p className="page-subtitle">Understanding the environmental science, contributing urban factors, and sustainable cooling solutions</p>
      </div>

      {/* Section 1: What is UHI? */}
      <section className="learn-section-card">
        <div className="section-head">
          <BookOpen size={22} className="text-emerald" />
          <h2>What Is the Urban Heat Island Effect?</h2>
        </div>
        <p className="learn-text">
          The <strong>Urban Heat Island (UHI)</strong> effect occurs when urbanized regions experience significantly higher surface and atmospheric temperatures compared to surrounding rural or natural areas. Structures such as roads, buildings, and industrial pavements absorb solar radiation and trap heat, creating localized microclimatic thermal spikes.
        </p>
      </section>

      {/* Section 2: Why Does It Happen? (Expandable Cause Cards) */}
      <section className="learn-section-card">
        <div className="section-head">
          <Flame size={22} className="text-red" />
          <h2>Why Does It Happen?</h2>
        </div>
        <p className="learn-subtext">Click on any contributing urban factor to explore detailed physics and impact:</p>

        <div className="causes-accordion">
          {causes.map((c) => {
            const Icon = c.icon;
            const isExpanded = expandedCause === c.id;

            return (
              <div
                key={c.id}
                className={`accordion-card ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setExpandedCause(isExpanded ? null : c.id)}
              >
                <div className="accordion-header">
                  <div className="accordion-title-box">
                    <Icon size={18} className="text-emerald" />
                    <h4>{c.title}</h4>
                  </div>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                <p className="accordion-summary">{c.summary}</p>

                {isExpanded && (
                  <div className="accordion-details-body">
                    <p>{c.details}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: Why Does It Matter? */}
      <section className="learn-section-card">
        <div className="section-head">
          <ShieldAlert size={22} className="text-amber" />
          <h2>Why Does It Matter?</h2>
        </div>
        <div className="impacts-grid">
          <div className="impact-box">
            <h4>Increased Health Exposure</h4>
            <p>Higher thermal stress increases risk of heat exhaustion, dehydration, and cardiovascular strain.</p>
          </div>
          <div className="impact-box">
            <h4>Elevated Energy Demand</h4>
            <p>Increased air conditioning usage overburdens local electrical power grids during summer peak hours.</p>
          </div>
          <div className="impact-box">
            <h4>Reduced Outdoor Comfort</h4>
            <p>Excessive pavement radiation discourages walking, cycling, and outdoor community activities.</p>
          </div>
        </div>
      </section>

      {/* Section 4: How Can Cities Reduce Urban Heat? */}
      <section className="learn-section-card">
        <div className="section-head">
          <CheckCircle2 size={22} className="text-emerald" />
          <h2>How Can Cities Reduce Urban Heat?</h2>
        </div>

        <div className="solutions-grid">
          {solutions.map((sol, idx) => {
            const Icon = sol.icon;
            return (
              <div key={idx} className="solution-card">
                <Icon size={20} className="text-emerald" />
                <h4>{sol.title}</h4>
                <p>{sol.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default LearnPage;
