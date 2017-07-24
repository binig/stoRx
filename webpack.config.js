module.exports = {
 entry: './src/index.ts',
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
     path:'dist',
   filename: 'bundle.js',
   path: __dirname
 }
};
