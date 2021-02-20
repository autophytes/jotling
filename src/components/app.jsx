// Import dependencies
import React from 'react';

import LeftNavContextProvider from '../contexts/leftNavContext';
import RightNavContextProvider from '../contexts/rightNavContext';
import FindReplaceContextProvider from '../contexts/findReplaceContext';
import SettingsContextProvider from '../contexts/settingsContext';
import StatsContextProvider from '../contexts/statsContext';
import AppMgmt from './appMgmt';

// Create main App component, context providers
const App = () => {
	return (
		<>
			<LeftNavContextProvider>
				<RightNavContextProvider>
					<FindReplaceContextProvider>
						<SettingsContextProvider>
							<StatsContextProvider>
								<AppMgmt />
							</StatsContextProvider>
						</SettingsContextProvider>
					</FindReplaceContextProvider>
				</RightNavContextProvider>
			</LeftNavContextProvider>
		</>
	);
};

// Export the App component
export default App;
