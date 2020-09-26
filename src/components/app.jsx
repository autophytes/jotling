// Import dependencies
import React from 'react';

import LeftNavContextProvider from '../contexts/leftNavContext';
import FindReplaceContextProvider from '../contexts/findReplaceContext';
import SettingsContextProvider from '../contexts/settingsContext';
import AppMgmt from './appMgmt';

// Create main App component, context providers
const App = () => {
	return (
		<>
			<LeftNavContextProvider>
				<FindReplaceContextProvider>
					<SettingsContextProvider>
						<AppMgmt />
					</SettingsContextProvider>
				</FindReplaceContextProvider>
			</LeftNavContextProvider>
		</>
	);
};

// Export the App component
export default App;
