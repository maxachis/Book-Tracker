export namespace model {
	
	export class Book {
	    id: string;
	    title: string;
	    author?: string;
	    current_progress: number;
	    total_progress: number;
	    progress_type: string;
	    target_date?: string;
	    completed_at?: string;
	    created_at: string;
	
	    static createFrom(source: any = {}) {
	        return new Book(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.author = source["author"];
	        this.current_progress = source["current_progress"];
	        this.total_progress = source["total_progress"];
	        this.progress_type = source["progress_type"];
	        this.target_date = source["target_date"];
	        this.completed_at = source["completed_at"];
	        this.created_at = source["created_at"];
	    }
	}
	export class CSVBookRecord {
	    title: string;
	    author?: string;
	    current_progress: number;
	    total_progress: number;
	    progress_type: string;
	    target_date?: string;
	    completed_at?: string;
	
	    static createFrom(source: any = {}) {
	        return new CSVBookRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.author = source["author"];
	        this.current_progress = source["current_progress"];
	        this.total_progress = source["total_progress"];
	        this.progress_type = source["progress_type"];
	        this.target_date = source["target_date"];
	        this.completed_at = source["completed_at"];
	    }
	}
	export class CreateBookRequest {
	    title: string;
	    author?: string;
	    total_progress: number;
	    progress_type: string;
	    target_date?: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateBookRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.author = source["author"];
	        this.total_progress = source["total_progress"];
	        this.progress_type = source["progress_type"];
	        this.target_date = source["target_date"];
	    }
	}
	export class BookSessionSummary {
	    book_id: string;
	    title: string;
	    progress_delta: number;
	    progress_type: string;

	    static createFrom(source: any = {}) {
	        return new BookSessionSummary(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.book_id = source["book_id"];
	        this.title = source["title"];
	        this.progress_delta = source["progress_delta"];
	        this.progress_type = source["progress_type"];
	    }
	}
	export class DailyReadingSummary {
	    date: string;
	    books: BookSessionSummary[];

	    static createFrom(source: any = {}) {
	        return new DailyReadingSummary(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.date = source["date"];
	        this.books = this.convertValues(source["books"], BookSessionSummary);
	    }

	    convertValues(a: any, classs: any, asMap: boolean = false): any {
	        if (!a) { return a; }
	        if (a.slice && a.map) { return (a as any[]).map(elem => this.convertValues(elem, classs)); }
	        else if ("object" === typeof a) { if (asMap) { for (const key of Object.keys(a)) { a[key] = new classs(a[key]); } return a; } return new classs(a); }
	        return a;
	    }
	}
	export class DuplicateReport {
	    title: string;
	    author?: string;
	
	    static createFrom(source: any = {}) {
	        return new DuplicateReport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.author = source["author"];
	    }
	}
	export class UpdateBookRequest {
	    id: string;
	    title?: string;
	    author?: string;
	    current_progress?: number;
	    total_progress?: number;
	    progress_type?: string;
	    target_date?: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateBookRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.author = source["author"];
	        this.current_progress = source["current_progress"];
	        this.total_progress = source["total_progress"];
	        this.progress_type = source["progress_type"];
	        this.target_date = source["target_date"];
	    }
	}
	export class UpdateSettingsRequest {
	    reading_start_hour?: number;
	    reading_end_hour?: number;
	    stats_start_date?: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateSettingsRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.reading_start_hour = source["reading_start_hour"];
	        this.reading_end_hour = source["reading_end_hour"];
	        this.stats_start_date = source["stats_start_date"];
	    }
	}
	export class UserSettings {
	    id: number;
	    reading_start_hour: number;
	    reading_end_hour: number;
	    stats_start_date?: string;
	
	    static createFrom(source: any = {}) {
	        return new UserSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.reading_start_hour = source["reading_start_hour"];
	        this.reading_end_hour = source["reading_end_hour"];
	        this.stats_start_date = source["stats_start_date"];
	    }
	}

}

