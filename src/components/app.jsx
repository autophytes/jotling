// Import dependencies
import React from 'react';

import LeftNavContextProvider from '../contexts/leftNavContext';
import FindReplaceContextProvider from '../contexts/findReplaceContext';
import AppMgmt from './appMgmt';

// Create main App component, context providers
const App = () => {
	return (
		<>
			<LeftNavContextProvider>
				<FindReplaceContextProvider>
					<AppMgmt />
				</FindReplaceContextProvider>
			</LeftNavContextProvider>
		</>
	);
};

// Export the App component
export default App;
