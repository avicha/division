window.onload = function() {
    var sourceCanvas = document.getElementById('source');
    var targetCanvas = document.getElementById('target');
    var sourceContext = sourceCanvas.getContext('2d');
    var targetContext = targetCanvas.getContext('2d');
    var w, h, avgGray = 0,
        stdGray = 0,
        delta = 3,
        quantity = 2;
    var grayScaleImage = function(sourceData) {
        var targetData = [];
        for (var i = 0, row = sourceData.length; i < row; i++) {
            targetData[i] = [];
            for (var j = 0, column = sourceData[i].length; j < column; j++) {
                var val = sourceData[i][j];
                targetData[i][j] = {
                    i: i,
                    j: j,
                    r: val.gray,
                    g: val.gray,
                    b: val.gray,
                    a: val.a,
                    gray: val.gray
                };
            }
        }
        return targetData;
    };
    var binarizationImage = function(sourceData) {
        var targetData = [];
        for (var i = 0, row = sourceData.length; i < row; i++) {
            targetData[i] = [];
            for (var j = 0, column = sourceData[i].length; j < column; j++) {
                var val = sourceData[i][j];
                var gray = ((val.gray >= avgGray - delta * stdGray) && (val.gray <= avgGray + delta * stdGray)) ? 0 : 255;
                targetData[i][j] = {
                    i: i,
                    j: j,
                    r: gray,
                    g: gray,
                    b: gray,
                    a: val.a,
                    gray: gray
                };
            }
        }
        return targetData;
    };
    var getZones = function(sourceData) {
        var zones = [],
            currentZone,
            n = 0,
            isNew = false;
        for (var i = 0, row = sourceData.length; i < row; i++) {
            for (var j = 0, column = sourceData[i].length; j < column; j++) {
                var val = sourceData[i][j];
                if (val.gray && !val.n) {
                    var stack = [val];
                    var item;
                    while (item = stack.shift()) {
                        if (!isNew) {
                            isNew = true;
                            n++;
                            item.n = n;
                            currentZone = {
                                tail: item,
                                head: item,
                                num: 1,
                                i: item.i,
                                j: item.j
                            };
                            zones.push(currentZone);
                        } else {
                            item.n = n;
                            currentZone.tail.next = item;
                            currentZone.tail = item;
                            currentZone.num++;
                            currentZone.i += item.i;
                            currentZone.j += item.j;
                        }
                        var n = item.i,
                            m = item.j,
                            tmp;
                        if (n) {
                            tmp = sourceData[n - 1][m];
                            if (!tmp.n && tmp.gray) {
                                tmp.n = n;
                                stack.push(tmp);
                            }
                        }
                        if (n < row - 1) {
                            tmp = sourceData[n + 1][m];
                            if (!tmp.n && tmp.gray) {
                                tmp.n = n;
                                stack.push(tmp);
                            }
                        }
                        if (m) {
                            tmp = sourceData[n][m - 1];
                            if (!tmp.n && tmp.gray) {
                                tmp.n = n;
                                stack.push(tmp);
                            }
                        }
                        if (m < column - 1) {
                            tmp = sourceData[n][m + 1];
                            if (!tmp.n && tmp.gray) {
                                tmp.n = n;
                                stack.push(tmp);
                            }
                        }
                    }
                } else {
                    isNew = false;
                }
            }
        }
        zones = zones.filter(function(zone) {
            return zone.num > 100;
        });
        n = zones.length;
        console.log(n);
        // zones.forEach(function(zoneA) {
        //     console.log(zones.map(function(zoneB) {
        //         return (zoneA.num / zoneB.num);
        //     }).join(', '));
        // });
        zones.forEach(function(zone) {
            zone.i /= zone.num;
            zone.j /= zone.num;
        });
        if (n >= quantity) {
            var n = 0;
            var zone = zones[0];
            var head, tail;
            while (zone) {
                if (!head) {
                    head = zone;
                } else {
                    tail.next = zone;
                    zone.prev = tail;
                }
                tail = zone;
                n++;
                zone.n = n;
                var minDisZone = null,
                    minDis = Infinity;
                zones.forEach(function(z) {
                    if (!z.n) {
                        var dis = (z.i - zone.i) * (z.i - zone.i) + (z.j - zone.j) * (z.j - zone.j);
                        if (dis < minDis) {
                            minDis = dis;
                            minDisZone = z;
                        }
                    }
                });
                zone = minDisZone;
            }
            tail.next = head;
            head.prev = tail;
            return head;
        } else {
            console.error('数量不足');
        }
    };
    var renderImage = function(url, callback) {
        var image = new Image();
        image.onload = function() {
            w = 480;
            h = Math.round(this.height * w / this.width);
            sourceCanvas.width = w;
            sourceCanvas.height = h;
            sourceContext.drawImage(image, 0, 0, this.width, this.height, 0, 0, w, h);
            if (callback) {
                callback(null);
            }
        };
        image.src = url;
    };
    var getImageData = function() {
        var imgData = sourceContext.getImageData(0, 0, w, h);
        var sourceData = [];
        var points = [],
            sum = 0,
            variance = 0;
        for (var i = 0; i < h; i++) {
            sourceData[i] = [];
        }
        //遍历颜色
        for (var i = 0; i < imgData.data.length; i += 4) {
            var num = i / 4;
            var row = Math.floor(num / w);
            var column = num % w;
            sourceData[row][column] = {
                i: row,
                j: column,
                r: imgData.data[i],
                g: imgData.data[i + 1],
                b: imgData.data[i + 2],
                a: imgData.data[i + 3],
                gray: imgData.data[i] * 0.299 + imgData.data[i + 1] * 0.587 + imgData.data[i + 2] * 0.114
            }
            if (row < 100 && (column < 100 || column > w - 100) || row > h - 100 && (column < 100 || column > w - 100)) {
                var gray = sourceData[row][column].gray
                points.push(gray);
                sum += gray;
            }
        }
        avgGray = sum / points.length;
        points.forEach(function(g) {
            variance += Math.pow(g - avgGray, 2);
        });
        stdGray = Math.sqrt(variance / points.length);
        console.log(avgGray, stdGray);
        return sourceData;
    };
    var drawImage = function(targetData) {
        var imgData = sourceContext.getImageData(0, 0, w, h);
        targetCanvas.width = sourceCanvas.width;
        targetCanvas.height = sourceCanvas.height;
        for (var i = 0; i < imgData.data.length; i += 4) {
            var num = i / 4;
            var row = Math.floor(num / w);
            var column = num % w;
            imgData.data[i] = targetData[row][column].r;
            imgData.data[i + 1] = targetData[row][column].g;
            imgData.data[i + 2] = targetData[row][column].b;
            imgData.data[i + 3] = targetData[row][column].a;
        }
        targetContext.putImageData(imgData, 0, 0);
    };
    var drawZones = function(link) {
        var object = link;
        targetCanvas.width = sourceCanvas.width;
        targetCanvas.height = sourceCanvas.height;
        targetContext.strokeStyle = '#f00';
        targetContext.beginPath();
        targetContext.moveTo(object.j, object.i);
        while (object.next != link) {
            // var p1 = object,
            //     p2 = object;
            // for (var i = 0; i < quantity; i++) {
            //     p2 = p2.next;
            // }
            // var s1 = {
            //     i: (p1.i + p1.prev.i) / 2,
            //     j: (p1.j + p1.prev.j) / 2,
            // };
            // var s2 = {
            //     i: (p2.i + p2.next.i) / 2,
            //     j: (p2.j + p2.next.j) / 2,
            // };
            object = object.next;
            targetContext.lineTo(object.j, object.i);
        }
        targetContext.lineTo(link.j, link.i);
        targetContext.stroke();
        targetContext.closePath();
    };
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
    }, false);
    document.addEventListener('drop', function(e) {
        e.preventDefault();
        var file = e.dataTransfer.files[0];
        if (~file.type.indexOf('image')) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var base64 = e.target.result;
                renderImage(base64, function() {
                    var sourceData = getImageData();
                    var link = getZones(sourceData);
                    drawZones(link);
                    // var targetData = binarizationImage(grayScaleImage(sourceData));
                    // drawImage(targetData);
                });
            };
            reader.readAsDataURL(file);
        }
    }, false);
};