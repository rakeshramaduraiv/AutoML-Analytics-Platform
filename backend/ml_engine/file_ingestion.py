"""
Enterprise File Ingestion & Normalization Layer
Handles multiple file formats with validation and unified data access
"""

import pandas as pd
import json
import xml.etree.ElementTree as ET
import chardet
import os
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging

class FileType(Enum):
    CSV = "csv"
    XLSX = "xlsx"
    TSV = "tsv"
    JSON = "json"
    XML = "xml"
    PARQUET = "parquet"
    TXT = "txt"
    LOG = "log"
    UNSUPPORTED = "unsupported"

@dataclass
class FileMetadata:
    """Comprehensive file metadata structure"""
    filename: str
    file_type: FileType
    size_bytes: int
    encoding: str
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    columns: Optional[list] = None
    is_valid: bool = True
    error_message: Optional[str] = None
    processing_notes: list = None

class FileIngestionEngine:
    """
    Enterprise-grade file ingestion engine
    Handles validation, normalization, and metadata extraction
    """
    
    # File size limits (configurable for enterprise deployment)
    MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB
    SUPPORTED_EXTENSIONS = {
        '.csv': FileType.CSV,
        '.xlsx': FileType.XLSX,
        '.xls': FileType.XLSX,
        '.tsv': FileType.TSV,
        '.json': FileType.JSON,
        '.xml': FileType.XML,
        '.parquet': FileType.PARQUET,
        '.txt': FileType.TXT,
        '.log': FileType.LOG
    }
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def ingest_file(self, file_path: str) -> Tuple[Optional[pd.DataFrame], FileMetadata]:
        """
        Main ingestion method - handles any supported file type
        Returns: (DataFrame or None, FileMetadata)
        """
        try:
            # Step 1: Basic file validation
            metadata = self._extract_basic_metadata(file_path)
            if not metadata.is_valid:
                return None, metadata
            
            # Step 2: File type specific processing
            dataframe = self._process_by_type(file_path, metadata)
            
            # Step 3: Update metadata with dataframe info
            if dataframe is not None:
                metadata.row_count = len(dataframe)
                metadata.column_count = len(dataframe.columns)
                metadata.columns = list(dataframe.columns)
                metadata.processing_notes = metadata.processing_notes or []
                metadata.processing_notes.append(f"Successfully normalized to DataFrame: {metadata.row_count}x{metadata.column_count}")
            
            return dataframe, metadata
            
        except Exception as e:
            error_metadata = FileMetadata(
                filename=os.path.basename(file_path),
                file_type=FileType.UNSUPPORTED,
                size_bytes=0,
                encoding="unknown",
                is_valid=False,
                error_message=f"Ingestion failed: {str(e)}"
            )
            return None, error_metadata
    
    def _extract_basic_metadata(self, file_path: str) -> FileMetadata:
        """Extract basic file metadata and validate"""
        filename = os.path.basename(file_path)
        
        # Check file exists
        if not os.path.exists(file_path):
            return FileMetadata(
                filename=filename,
                file_type=FileType.UNSUPPORTED,
                size_bytes=0,
                encoding="unknown",
                is_valid=False,
                error_message="File not found"
            )
        
        # Get file size
        size_bytes = os.path.getsize(file_path)
        
        # Check size limits
        if size_bytes > self.MAX_FILE_SIZE:
            return FileMetadata(
                filename=filename,
                file_type=FileType.UNSUPPORTED,
                size_bytes=size_bytes,
                encoding="unknown",
                is_valid=False,
                error_message=f"File too large: {size_bytes} bytes (max: {self.MAX_FILE_SIZE})"
            )
        
        # Detect file type
        file_extension = os.path.splitext(filename)[1].lower()
        file_type = self.SUPPORTED_EXTENSIONS.get(file_extension, FileType.UNSUPPORTED)
        
        if file_type == FileType.UNSUPPORTED:
            return FileMetadata(
                filename=filename,
                file_type=file_type,
                size_bytes=size_bytes,
                encoding="unknown",
                is_valid=False,
                error_message=f"Unsupported file type: {file_extension}"
            )
        
        # Detect encoding for text-based files
        encoding = self._detect_encoding(file_path, file_type)
        
        return FileMetadata(
            filename=filename,
            file_type=file_type,
            size_bytes=size_bytes,
            encoding=encoding,
            is_valid=True,
            processing_notes=[]
        )
    
    def _detect_encoding(self, file_path: str, file_type: FileType) -> str:
        """Detect file encoding for text-based files"""
        if file_type in [FileType.XLSX, FileType.PARQUET]:
            return "binary"
        
        try:
            with open(file_path, 'rb') as f:
                raw_data = f.read(10000)  # Sample first 10KB
                result = chardet.detect(raw_data)
                return result.get('encoding', 'utf-8') or 'utf-8'
        except:
            return 'utf-8'
    
    def _process_by_type(self, file_path: str, metadata: FileMetadata) -> Optional[pd.DataFrame]:
        """Process file based on detected type"""
        
        if metadata.file_type == FileType.CSV:
            return self._process_csv(file_path, metadata)
        elif metadata.file_type == FileType.TSV:
            return self._process_tsv(file_path, metadata)
        elif metadata.file_type == FileType.XLSX:
            return self._process_excel(file_path, metadata)
        elif metadata.file_type == FileType.JSON:
            return self._process_json(file_path, metadata)
        elif metadata.file_type == FileType.XML:
            return self._process_xml(file_path, metadata)
        elif metadata.file_type == FileType.PARQUET:
            return self._process_parquet(file_path, metadata)
        elif metadata.file_type in [FileType.TXT, FileType.LOG]:
            return self._process_text(file_path, metadata)
        
        return None
    
    def _process_csv(self, file_path: str, metadata: FileMetadata) -> pd.DataFrame:
        """Process CSV files with intelligent parameter detection"""
        try:
            # Try multiple separators and encodings
            separators = [',', ';', '|']
            
            for sep in separators:
                try:
                    df = pd.read_csv(file_path, sep=sep, encoding=metadata.encoding, 
                                   low_memory=False, na_values=['', 'NULL', 'null', 'N/A', 'n/a'])
                    
                    # Validate: should have multiple columns for CSV
                    if len(df.columns) > 1:
                        metadata.processing_notes.append(f"CSV processed with separator '{sep}'")
                        return df
                except:
                    continue
            
            # Fallback: try with Python engine
            df = pd.read_csv(file_path, encoding=metadata.encoding, engine='python',
                           low_memory=False, na_values=['', 'NULL', 'null', 'N/A', 'n/a'])
            metadata.processing_notes.append("CSV processed with Python engine fallback")
            return df
            
        except Exception as e:
            raise Exception(f"CSV processing failed: {str(e)}")
    
    def _process_tsv(self, file_path: str, metadata: FileMetadata) -> pd.DataFrame:
        """Process TSV files"""
        try:
            df = pd.read_csv(file_path, sep='\t', encoding=metadata.encoding,
                           low_memory=False, na_values=['', 'NULL', 'null', 'N/A', 'n/a'])
            metadata.processing_notes.append("TSV processed successfully")
            return df
        except Exception as e:
            raise Exception(f"TSV processing failed: {str(e)}")
    
    def _process_excel(self, file_path: str, metadata: FileMetadata) -> pd.DataFrame:
        """Process Excel files"""
        try:
            # Read first sheet by default
            df = pd.read_excel(file_path, sheet_name=0, na_values=['', 'NULL', 'null', 'N/A', 'n/a'])
            metadata.processing_notes.append("Excel processed (first sheet)")
            return df
        except Exception as e:
            raise Exception(f"Excel processing failed: {str(e)}")
    
    def _process_json(self, file_path: str, metadata: FileMetadata) -> pd.DataFrame:
        """Process JSON files - handle both array and nested structures"""
        try:
            with open(file_path, 'r', encoding=metadata.encoding) as f:
                data = json.load(f)
            
            # Handle different JSON structures
            if isinstance(data, list):
                df = pd.json_normalize(data)
                metadata.processing_notes.append("JSON array normalized to DataFrame")
            elif isinstance(data, dict):
                # Try to find array-like structures
                for key, value in data.items():
                    if isinstance(value, list) and len(value) > 0:
                        df = pd.json_normalize(value)
                        metadata.processing_notes.append(f"JSON object '{key}' array normalized")
                        break
                else:
                    # Single record
                    df = pd.json_normalize([data])
                    metadata.processing_notes.append("Single JSON object normalized")
            else:
                raise Exception("Unsupported JSON structure")
            
            return df
            
        except Exception as e:
            raise Exception(f"JSON processing failed: {str(e)}")
    
    def _process_xml(self, file_path: str, metadata: FileMetadata) -> pd.DataFrame:
        """Process XML files - basic structure extraction"""
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            # Extract data from XML (simplified approach)
            records = []
            
            # Find repeating elements (likely data records)
            children = list(root)
            if children:
                # Assume first level children are records
                for child in children:
                    record = {}
                    for elem in child:
                        record[elem.tag] = elem.text
                    records.append(record)
            
            if not records:
                # Try root attributes as single record
                records = [root.attrib] if root.attrib else [{'content': root.text}]
            
            df = pd.DataFrame(records)
            metadata.processing_notes.append("XML structure extracted to DataFrame")
            return df
            
        except Exception as e:
            raise Exception(f"XML processing failed: {str(e)}")
    
    def _process_parquet(self, file_path: str, metadata: FileMetadata) -> pd.DataFrame:
        """Process Parquet files"""
        try:
            df = pd.read_parquet(file_path)
            metadata.processing_notes.append("Parquet processed successfully")
            return df
        except Exception as e:
            raise Exception(f"Parquet processing failed: {str(e)}")
    
    def _process_text(self, file_path: str, metadata: FileMetadata) -> pd.DataFrame:
        """Process text/log files - metadata-level analysis only"""
        try:
            with open(file_path, 'r', encoding=metadata.encoding) as f:
                lines = f.readlines()
            
            # Create basic metadata DataFrame
            df = pd.DataFrame({
                'line_number': range(1, len(lines) + 1),
                'content': [line.strip() for line in lines],
                'length': [len(line.strip()) for line in lines]
            })
            
            metadata.processing_notes.append(f"Text file processed as line-by-line DataFrame ({len(lines)} lines)")
            return df
            
        except Exception as e:
            raise Exception(f"Text processing failed: {str(e)}")

# Usage example and testing
if __name__ == "__main__":
    ingestion_engine = FileIngestionEngine()
    
    # Test with sample file
    test_file = "sample_data.csv"  # Replace with actual file path
    dataframe, metadata = ingestion_engine.ingest_file(test_file)
    
    print("File Metadata:")
    print(f"  Filename: {metadata.filename}")
    print(f"  Type: {metadata.file_type.value}")
    print(f"  Size: {metadata.size_bytes} bytes")
    print(f"  Encoding: {metadata.encoding}")
    print(f"  Valid: {metadata.is_valid}")
    
    if dataframe is not None:
        print(f"  Rows: {metadata.row_count}")
        print(f"  Columns: {metadata.column_count}")
        print(f"  Column Names: {metadata.columns}")
    
    if metadata.processing_notes:
        print("  Processing Notes:")
        for note in metadata.processing_notes:
            print(f"    - {note}")
    
    if metadata.error_message:
        print(f"  Error: {metadata.error_message}")