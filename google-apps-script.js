const SHEET_NAME = "Hoja 1"; // Asegúrate de que tu pestaña se llame así
const HEADERS = [
    "ID",
    "Proceso",
    "Tipo de Proceso",
    "Presupuesto",
    "Fecha Creación",
    "Informe Est. Mercado",
    "Inicio Proceso",
    "Días Inicio Proceso",
    "Cert Planificación",
    "Días Planificación",
    "Cert Compras",
    "Días Compras",
    "Cert Financiero",
    "Días Financiero",
    "Cert Delegado",
    "Días Delegado",
    "Cert Jurídico",
    "Días Jurídico",
    "Cert Adjudicado",
    "Días Adjudicada",
    "Monto Adjudicado"
];

function getOrCreateSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        sheet.appendRow(HEADERS);
    }
    return sheet;
}

const DATE_FIELDS = [
    "memoArrivalDate",
    "marketStudyReportDate",
    "processStartDate",
    "planningCertDate",
    "delegateCertDate",
    "legalCertDate",
    "procurementCertDate",
    "awardedCertDate",
    "financialCertDate",
    "createdAt"
];

/**
 * Convierte un string de fecha a un objeto Date real de Google Sheets.
 * Esto es CRÍTICO para que las fórmulas de resta de fechas funcionen.
 */
function parseDateToReal(dateStr) {
    if (!dateStr) return "";

    let cleaned = dateStr;

    // Si viene como ISO datetime (ej: 2026-02-13T09:21:05.123Z), extraer solo la fecha
    if (typeof cleaned === 'string' && cleaned.indexOf('T') !== -1) {
        cleaned = cleaned.split('T')[0];
    }

    // Si viene en DD/MM/YYYY convertimos a YYYY-MM-DD
    if (typeof cleaned === 'string' && cleaned.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const parts = cleaned.split('/');
        cleaned = parts[2] + '-' + parts[1] + '-' + parts[0];
    }

    // Si es YYYY-MM-DD, crear un objeto Date real
    if (typeof cleaned === 'string' && cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const parts = cleaned.split('-');
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }

    return "";
}

/**
 * Formato antiguo que devuelve string - se mantiene pero ya no se usa para escritura.
 * Solo se usa internamente si es necesario.
 */
function formatDateForSheet(dateStr) {
    if (!dateStr) return "";
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    if (dateStr.indexOf('T') !== -1) {
        return dateStr.split('T')[0];
    }
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const parts = dateStr.split('/');
        return parts[2] + '-' + parts[1] + '-' + parts[0];
    }
    return dateStr;
}

function formatDateForApp(val) {
    if (!val) return "";

    // Si es un objeto Date de Google Sheets
    if (val instanceof Date) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

    // Si es un string, intentar detectar el formato
    if (typeof val === 'string') {
        // DD/MM/YYYY
        if (val.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            const parts = val.split('/');
            return parts[2] + '-' + parts[1] + '-' + parts[0];
        }
        // ISO String (YYYY-MM-DDTHH:mm...)
        if (val.match(/^\d{4}-\d{2}-\d{2}T/)) {
            return val.split('T')[0];
        }
    }

    return val;
}

/**
 * Genera la fórmula de días para una fila dada.
 * Mapeo de columnas:
 * A=ID, B=Proceso, C=Tipo de Proceso, D=Presupuesto, E=Fecha Creación
 * F=Informe Est. Mercado
 * G=Inicio Proceso, H=Días Inicio Proceso
 * I=Cert Planificación, J=Días Planificación
 * K=Cert Compras, L=Días Compras
 * M=Cert Financiero, N=Días Financiero
 * O=Cert Delegado, P=Días Delegado
 * Q=Cert Jurídico, R=Días Jurídico
 * S=Cert Adjudicado, T=Días Adjudicada
 * U=Monto Adjudicado
 */
function getDaysFormula(daysHeader, rowIdx) {
    switch (daysHeader) {
        case "Días Inicio Proceso":
            return '=IF(OR(G' + rowIdx + '="", F' + rowIdx + '=""), "", G' + rowIdx + '-F' + rowIdx + ')';
        case "Días Planificación":
            return '=IF(OR(I' + rowIdx + '="", G' + rowIdx + '=""), "", I' + rowIdx + '-G' + rowIdx + ')';
        case "Días Compras":
            return '=IF(OR(K' + rowIdx + '="", I' + rowIdx + '=""), "", K' + rowIdx + '-I' + rowIdx + ')';
        case "Días Financiero":
            return '=IF(OR(M' + rowIdx + '="", K' + rowIdx + '=""), "", M' + rowIdx + '-K' + rowIdx + ')';
        case "Días Delegado":
            return '=IF(OR(O' + rowIdx + '="", M' + rowIdx + '=""), "", O' + rowIdx + '-M' + rowIdx + ')';
        case "Días Jurídico":
            return '=IF(OR(Q' + rowIdx + '="", O' + rowIdx + '=""), "", Q' + rowIdx + '-O' + rowIdx + ')';
        case "Días Adjudicada":
            return '=IF(OR(S' + rowIdx + '="", Q' + rowIdx + '=""), "", S' + rowIdx + '-Q' + rowIdx + ')';
        default:
            return null;
    }
}

/**
 * Mapeo: cuando se actualiza un stage de fecha, cuál es el header "Días" que
 * necesita ser refrescado (puede ser más de uno si la fecha afecta a dos fórmulas).
 */
function getAffectedDaysHeaders(stage) {
    switch (stage) {
        case "marketStudyReportDate":
            // El informe de mercado es la referencia para "Días Inicio Proceso"
            return ["Días Inicio Proceso"];
        case "processStartDate":
            // Inicio proceso afecta "Días Inicio Proceso" y "Días Planificación"
            return ["Días Inicio Proceso", "Días Planificación"];
        case "planningCertDate":
            // Planificación afecta "Días Planificación" y "Días Compras"
            return ["Días Planificación", "Días Compras"];
        case "procurementCertDate":
            // Compras afecta "Días Compras" y "Días Financiero"
            return ["Días Compras", "Días Financiero"];
        case "financialCertDate":
            // Financiero afecta "Días Financiero" y "Días Delegado"
            return ["Días Financiero", "Días Delegado"];
        case "delegateCertDate":
            // Delegado afecta "Días Delegado" y "Días Jurídico"
            return ["Días Delegado", "Días Jurídico"];
        case "legalCertDate":
            // Jurídico afecta "Días Jurídico" y "Días Adjudicada"
            return ["Días Jurídico", "Días Adjudicada"];
        case "awardedCertDate":
            // Adjudicado afecta "Días Adjudicada"
            return ["Días Adjudicada"];
        default:
            return [];
    }
}

function doGet() {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const jsonInfo = rows.map((row) => {
        let obj = {};
        headers.forEach((header, index) => {
            let key = "";
            switch (header) {
                case "ID": key = "id"; break;
                case "Proceso": key = "name"; break;
                case "Tipo de Proceso": key = "processType"; break;
                case "Presupuesto": key = "budget"; break;
                case "Fecha Creación": key = "createdAt"; break;
                case "Informe Est. Mercado": key = "marketStudyReportDate"; break;
                case "Inicio Proceso": key = "processStartDate"; break;
                case "Días Inicio Proceso": key = "processStartDays"; break;
                case "Cert Planificación": key = "planningCertDate"; break;
                case "Días Planificación": key = "planningDays"; break;
                case "Cert Compras": key = "procurementCertDate"; break;
                case "Días Compras": key = "procurementDays"; break;
                case "Cert Financiero": key = "financialCertDate"; break;
                case "Días Financiero": key = "financialDays"; break;
                case "Cert Delegado": key = "delegateCertDate"; break;
                case "Días Delegado": key = "delegateDays"; break;
                case "Cert Jurídico": key = "legalCertDate"; break;
                case "Días Jurídico": key = "legalDays"; break;
                case "Cert Adjudicado": key = "awardedCertDate"; break;
                case "Días Adjudicada": key = "awardedDays"; break;
                case "Monto Adjudicado": key = "finalAwardedAmount"; break;
                default: key = header;
            }

            let value = row[index];
            if (DATE_FIELDS.includes(key)) {
                value = formatDateForApp(value);
            }
            // Skip formula error values if any
            if (value === "#NUM!" || value === "#VALUE!" || value === "#DIV/0!") {
                value = "";
            }
            obj[key] = value;
        });
        return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(jsonInfo))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        const sheet = getOrCreateSheet();
        const data = JSON.parse(e.postData.contents);
        const action = data.action;

        if (action === "add") {
            const payload = data.payload;

            // La fila donde se insertará (última fila + 1)
            const rowIdx = sheet.getLastRow() + 1;

            // Construir array de valores (sin fórmulas, solo datos)
            const newRow = HEADERS.map(header => {
                switch (header) {
                    case "ID": return payload["id"] || "";
                    case "Proceso": return payload["name"] || "";
                    case "Tipo de Proceso": return payload["processType"] || "";
                    case "Presupuesto": return payload["budget"] || "";
                    case "Fecha Creación": return parseDateToReal(payload["createdAt"]);

                    case "Informe Est. Mercado":
                        return parseDateToReal(payload["marketStudyReportDate"]);

                    case "Inicio Proceso":
                        return parseDateToReal(payload["processStartDate"]);
                    case "Días Inicio Proceso":
                        return ""; // Se llenará con fórmula después

                    case "Cert Planificación":
                        return parseDateToReal(payload["planningCertDate"]);
                    case "Días Planificación":
                        return ""; // Se llenará con fórmula después

                    case "Cert Compras":
                        return parseDateToReal(payload["procurementCertDate"]);
                    case "Días Compras":
                        return ""; // Se llenará con fórmula después

                    case "Cert Financiero":
                        return parseDateToReal(payload["financialCertDate"]);
                    case "Días Financiero":
                        return ""; // Se llenará con fórmula después

                    case "Cert Delegado":
                        return parseDateToReal(payload["delegateCertDate"]);
                    case "Días Delegado":
                        return ""; // Se llenará con fórmula después

                    case "Cert Jurídico":
                        return parseDateToReal(payload["legalCertDate"]);
                    case "Días Jurídico":
                        return ""; // Se llenará con fórmula después

                    case "Cert Adjudicado":
                        return parseDateToReal(payload["awardedCertDate"]);
                    case "Días Adjudicada":
                        return ""; // Se llenará con fórmula después

                    case "Monto Adjudicado":
                        return payload["finalAwardedAmount"] || "";
                }
                return "";
            });

            // Paso 1: Insertar la fila con valores reales (fechas como Date objects)
            sheet.getRange(rowIdx, 1, 1, newRow.length).setValues([newRow]);

            // Paso 2: Establecer las fórmulas en las columnas de "Días" usando setFormula()
            // Esto garantiza que Google Sheets las interprete como fórmulas reales
            const daysColumns = [
                { header: "Días Inicio Proceso", col: 8 },   // H
                { header: "Días Planificación", col: 10 },    // J
                { header: "Días Compras", col: 12 },          // L
                { header: "Días Financiero", col: 14 },       // N
                { header: "Días Delegado", col: 16 },         // P
                { header: "Días Jurídico", col: 18 },         // R
                { header: "Días Adjudicada", col: 20 }        // T
            ];

            daysColumns.forEach(dc => {
                const formula = getDaysFormula(dc.header, rowIdx);
                if (formula) {
                    sheet.getRange(rowIdx, dc.col).setFormula(formula);
                }
            });

            return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Proceso agregado" }))
                .setMimeType(ContentService.MimeType.JSON);

        } else if (action === "update") {
            const payload = data.payload;
            const stage = data.stage;
            const id = payload.id;
            const range = sheet.getDataRange();
            const values = range.getValues();
            const headers = values[0];

            let targetHeader = "";
            switch (stage) {
                case "marketStudyReportDate": targetHeader = "Informe Est. Mercado"; break;
                case "processStartDate": targetHeader = "Inicio Proceso"; break;
                case "planningCertDate": targetHeader = "Cert Planificación"; break;
                case "delegateCertDate": targetHeader = "Cert Delegado"; break;
                case "legalCertDate": targetHeader = "Cert Jurídico"; break;
                case "procurementCertDate": targetHeader = "Cert Compras"; break;
                case "awardedCertDate": targetHeader = "Cert Adjudicado"; break;
                case "financialCertDate": targetHeader = "Cert Financiero"; break;
                case "finalAwardedAmount": targetHeader = "Monto Adjudicado"; break;
            }

            let colIndex = -1;
            if (targetHeader) {
                colIndex = headers.indexOf(targetHeader);
            }

            let rowIndex = -1;
            for (let i = 1; i < values.length; i++) {
                if (values[i][0] == id) {
                    rowIndex = i + 1; // +1 porque getRange es 1-indexed
                    break;
                }
            }

            if (rowIndex !== -1 && colIndex !== -1) {
                let valueToSet = payload.value;

                // Si es un campo de fecha, convertir a Date real
                if (DATE_FIELDS.includes(stage)) {
                    valueToSet = parseDateToReal(valueToSet);
                }

                // Escribir el valor en la celda
                sheet.getRange(rowIndex, colIndex + 1).setValue(valueToSet);

                // CLAVE: Re-establecer las fórmulas de "Días" afectadas
                const affectedDays = getAffectedDaysHeaders(stage);
                affectedDays.forEach(daysHeader => {
                    const daysColIndex = headers.indexOf(daysHeader);
                    if (daysColIndex !== -1) {
                        const formula = getDaysFormula(daysHeader, rowIndex);
                        if (formula) {
                            sheet.getRange(rowIndex, daysColIndex + 1).setFormula(formula);
                        }
                    }
                });

                return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Proceso actualizado" }))
                    .setMimeType(ContentService.MimeType.JSON);
            }
        } else if (action === "delete") {
            const id = data.payload.id;
            const range = sheet.getDataRange();
            const values = range.getValues();

            let rowIndex = -1;
            for (let i = 1; i < values.length; i++) {
                if (values[i][0] == id) {
                    rowIndex = i + 1;
                    break;
                }
            }

            if (rowIndex !== -1) {
                sheet.deleteRow(rowIndex);
                return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Proceso eliminado" }))
                    .setMimeType(ContentService.MimeType.JSON);
            }
        }

        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Acción no reconocida o no encontrada" }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: e.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}
