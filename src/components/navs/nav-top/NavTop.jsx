import React from 'react';

const NavTop = () => {
	return (
		<nav className='top-nav'>
			<button className='nav-button with-text'>
				<img src='icons/scale.svg' />
				<span className='nav-button-text'>Full Screen</span>
			</button>
			<button className='nav-button with-text'>
				<img src='icons/table-grid.svg' />
				<span className='nav-button-text'>Card View</span>
			</button>
			<button className='nav-button with-text'>
				<img src='icons/right-alignment.svg' />
				<span className='nav-button-text'>Outline Mode</span>
			</button>
			<button className='nav-button with-text'>
				<img src='icons/calendar.svg' />
				<span className='nav-button-text'>Statistics</span>
			</button>
			<button className='nav-button with-text'>
				<img src='icons/settings.svg' />
				<span className='nav-button-text'>Project Settings</span>
			</button>
			<button className='nav-button with-text'>
				<img src='icons/user-settings.svg' />
				<span className='nav-button-text'>User Settings</span>
			</button>
			<button className='nav-button with-text'>
				<img src='icons/typewriter.svg' />
				<span className='nav-button-text'>Typewriter Mode</span>
			</button>
			<button className='nav-button with-text'>
				<img src='icons/tags.svg' />
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
