import React from 'react';
import FullScreenSVG from '../../../assets/svg/FullScreenSVG';
import TableGridSVG from '../../../assets/svg/TableGridSVG';
import OutlineBulletsSVG from '../../../assets/svg/OutlineBulletsSVG';
import StatsChartSVG from '../../../assets/svg/StatsChartSVG';
import SettingsSVG from '../../../assets/svg/SettingsSVG';
import SettingsUserSVG from '../../../assets/svg/SettingsUserSVG';
import TypewriterSVG from '../../../assets/svg/TypewriterSVG';
import TagMultipleSVG from '../../../assets/svg/TagMultipleSVG';

const NavTop = () => {
	return (
		<nav className='top-nav'>
			<button className='nav-button with-text'>
				{/* <img src='icons/scale.svg' /> */}
				<FullScreenSVG />
				<span className='nav-button-text'>Full Screen</span>
			</button>
			<button className='nav-button with-text'>
				{/* <img src='icons/table-grid.svg' /> */}
				<TableGridSVG />
				<span className='nav-button-text'>Card View</span>
			</button>
			<button className='nav-button with-text'>
				{/* <img src='icons/right-alignment.svg' /> */}
				<OutlineBulletsSVG />
				<span className='nav-button-text'>Outline Mode</span>
			</button>
			<button className='nav-button with-text'>
				{/* <img src='icons/calendar.svg' /> */}
				<StatsChartSVG />
				<span className='nav-button-text'>Statistics</span>
			</button>
			<button className='nav-button with-text'>
				{/* <img src='icons/settings.svg' /> */}
				<SettingsSVG />
				<span className='nav-button-text'>Project Settings</span>
			</button>
			<button className='nav-button with-text'>
				{/* <img src='icons/user-settings.svg' /> */}
				<SettingsUserSVG />
				<span className='nav-button-text'>User Settings</span>
			</button>
			<button className='nav-button with-text'>
				{/* <img src='icons/typewriter.svg' /> */}
				<TypewriterSVG />
				<span className='nav-button-text'>Typewriter Mode</span>
			</button>
			<button className='nav-button with-text'>
				{/* <img src='icons/tags.svg' /> */}
				<TagMultipleSVG />
				<span className='nav-button-text'>Tag View</span>
			</button>
			{/* <!-- 
        Full Screen
        Card View (cork board)
        Outline Mode
        Statistics
        Document Settings
        User Settings
        Typewriter Mode
        Tag View
       --> */}
		</nav>
	);
};

export default NavTop;
