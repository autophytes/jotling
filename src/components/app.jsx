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
	</>
);

// Export the App component
export default App;
