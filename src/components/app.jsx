// Import dependencies
import React from 'react';

import LeftNavContextProvider from '../contexts/leftNavContext';
import AppMgmt from './appMgmt';

// Create main App component, context providers
const App = () => {
	return (
		<>
			<LeftNavContextProvider>
				<AppMgmt />
			</LeftNavContextProvider>
		</>
	);
};

// Export the App component
export default App;
