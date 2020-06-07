import React from 'react';

const NavLeft = () => {
	return (
		<nav className='side-nav left-nav'>
			<div className='side-nav-container'>
				<div className='left-nav-top-buttons'>
					<button className='nav-button add-file-button'>
						<img src='icons/add.svg' />
						<img
							src='icons/expand-button.svg'
							style={{ width: '0.6rem', marginLeft: '0.25rem' }}
						/>
					</button>
					<button className='nav-button'>
						<img src='icons/pushpin.svg' />
					</button>
				</div>
				<div className='left-nav-sections'>
					<div className='nav-section-tab first active'>
						<img src='icons/pages.svg' />
					</div>
					<div className='nav-section-tab'>
						<img src='icons/lamp.svg' />
					</div>
					<div className='nav-section-tab last'>
						<img src='icons/book (2).svg' />
					</div>
				</div>
				<div className='left-nav-content'>
					<div className='file-nav folder'>
						<p className='file-nav folder title'>Chapter 1</p>
						<div className='folder-contents'>
							<p className='file-nav document'>Sub 1</p>
							<div className='file-nav folder'>
								<p className='file-nav folder title'>Sub 2</p>
								<div className='folder-contents'>
									<p className='file-nav document'>Sub sub 1</p>
									<p className='file-nav document'>Sub sub 2</p>
									<p className='file-nav document'>Sub sub 3</p>
								</div>
							</div>
						</div>
					</div>
					<p className='file-nav document'>Chapter 2</p>
					<p className='file-nav document'>Chapter 3</p>
					<p className='file-nav document'>Chapter 4</p>
					<p className='file-nav document'>Chapter 5</p>
				</div>
				<div className='left-nav-footer'>
					<p>497 words</p>
					<p>49% today's goal</p>
				</div>
			</div>
			<div className='vertical-rule' style={{ marginLeft: '0.5rem' }}></div>
		</nav>
	);
};

export default NavLeft;
