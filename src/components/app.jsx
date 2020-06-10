// Import dependencies
import React from 'react';
import NavTop from './navs/nav-top/NavTop';
import NavLeft from './navs/nav-left/NavLeft';
import NavRight from './navs/nav-right/NavRight';
import EditorContainer from './editor/EditorContainer';

// Create main App component
const App = () => (
	<>
		<NavTop />
		<NavLeft />
		<NavRight />
		<EditorContainer />
	</>
);

// Export the App component
export default App;
