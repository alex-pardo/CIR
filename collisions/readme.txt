#################
README
#################

DEPENDENCIAS

OPENNI2
	http://structure.io/openni

NITE2
	http://www.openni.ru/files/nite/index.html


INSTRUCCIONS

1- Canviar les referencies a les llibreries OpenNI2 i NITE2 del fitxer binding.gyp (linies 4 i 5)
2- Instalar node-gyp: npm install -g node-gyp
	Compilará el codi c++ i el linkara amb node.js (https://github.com/TooTallNate/node-gyp)
3- Executar node-gyp rebuild
4- Donarà OK
5- Executar node server.js
		
