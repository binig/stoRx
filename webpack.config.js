module.exports = {
 entry: './src/store/Store.ts',
 module: {
   rules: [
     {
       test: /\.tsx?$/,
       use: 'ts-loader',
       exclude: /node_modules/
     }
   ]
 },
 resolve: {
   extensions: [".tsx", ".ts", ".js"]
 },
 output: {
   filename: 'bundle.js',
   path: __dirname
 }
};
