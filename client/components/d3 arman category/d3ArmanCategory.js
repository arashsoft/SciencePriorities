
// add arman_category1 and arman_category2 scales to d3.scale


d3.scale.arman_category1 = function() {
	return d3.scale.ordinal().range(d3_arman_category1);
};


d3.scale.arman_category2 = function() {
  return d3.scale.ordinal().range(d3_arman_category2);
};
	

var d3_arman_category1 = [ 16711680, 5853952, 3635, 12517376, 8490089, 3163071, 4194304, 10944320, 12568831, 14263203, 3044096, 1900761, 6704461, 12582847, 2031693, 7540480, 13063, 4074841, 15899001, 3162162, 12878079, 9197894, 62081, 7938176, 13390336, 5482111, 16711918, 6698496, 62178, 10910883, 13403443, 22867, 7536701, 4997158, 52479, 13382533, 16771775, 23667, 16728153, 11708160, 31462 ].map(d3_rgbString);


var d3_arman_category2 = [ 16711680, 65280, 255, 16766720, 16711935, 65535, 8388608, 32768, 128, 8421376, 8388736, 8421504, 32896, 12582912, 49152, 192, 12632064, 12583104, 49344, 12632256, 4194304, 16384, 64, 4210688, 4194368, 16448, 4210752, 2097152, 8192, 32, 2105344, 2097184, 8224, 2105376, 6291456, 24576, 96, 6316032, 6291552, 24672, 6316128, 10485760, 40960, 160, 10526720, 10485920, 41120, 10526880, 14680064, 57344, 224, 14737408, 14680288, 57568,  14737632, 0 ,16776960].map(d3_rgbString);
		
function d3_rgbNumber(value) {
	return new d3.rgb(value >> 16, value >> 8 & 255, value & 255);
}

function d3_rgbString(value) {
	return d3_rgbNumber(value) + "";
}
	