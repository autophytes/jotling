// Import dependencies
import React from 'react';
import NavTop from './navs/nav-top/NavTop';
import NavLeft from './navs/nav-left/NavLeft';
import NavRight from './navs/nav-right/NavRight';
import Editor from './editor/Editor';

// Create main App component
const App = () => (
	<>
		<NavTop />
		<NavLeft />
		<NavRight />
		<Editor />

		<p>Let's start builasdfding your awesome desktop app with electron and React! Test</p>
	</>
);

// Export the App component
export default App;
