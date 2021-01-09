const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { spawn } = require('child_process');

// Any directories you will be adding code/files into, need to be added to this array so webpack will pick them up
const defaultInclude = path.resolve(__dirname, 'src');

module.exports = {
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
				include: defaultInclude,
			},
			{
				test: /\.(js|jsx)$/, // Changed to fix the .jsx entry point problem
				use: [{ loader: 'babel-loader' }],
				include: defaultInclude,
			},
			{
				test: /\.js$/,
				use: [{ loader: 'worker-loader' }, { loader: 'babel-loader' }],
				include: [path.join(__dirname, 'webWorkers')],
			},
			{
				test: /\.(jpe?g|png|gif)$/,
				use: [{ loader: 'file-loader?name=img/[name]__[hash:base64:5].[ext]' }],
				include: defaultInclude,
			},
			{
				test: /\.(eot|svg|ttf|woff|woff2)$/,
				use: [{ loader: 'file-loader?name=font/[name]__[hash:base64:5].[ext]' }],
				include: defaultInclude,
			},
		],
	},
	output: {
		path: path.resolve(__dirname, 'build'),
	},
	resolve: {
		// Added to fix the .jsx entry point problem
		extensions: ['*', '.js', '.jsx'],
	},
	target: 'electron-renderer',
	plugins: [
		new HtmlWebpackPlugin(),
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('development'),
		}),
	],
	devtool: 'cheap-source-map',
	devServer: {
		contentBase: path.resolve(__dirname, 'dist'),
		stats: {
			colors: true,
			chunks: false,
			children: false,
		},
		before() {
			spawn('electron', ['.'], { shell: true, env: process.env, stdio: 'inherit' })
				.on('close', (code) => process.exit(0))
				.on('error', (spawnError) => console.error(spawnError));
		},
	},
};
