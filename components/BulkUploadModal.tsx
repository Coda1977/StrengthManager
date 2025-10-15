'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ParsedMember {
  name: string;
  strengths: string[];
  isValid: boolean;
  errors: string[];
}

interface BulkUploadModalProps {
  onClose: () => void;
  onUpload: (members: Array<{ name: string; strengths: string[] }>) => Promise<void>;
  allStrengths: string[];
}

export default function BulkUploadModal({ onClose, onUpload, allStrengths }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const validateStrengths = (strengths: string[]): { valid: string[]; errors: string[] } => {
    const valid: string[] = [];
    const errors: string[] = [];
    
    strengths.forEach(strength => {
      const trimmed = strength.trim();
      if (allStrengths.includes(trimmed)) {
        valid.push(trimmed);
      } else if (trimmed) {
        errors.push(`Invalid strength: "${trimmed}"`);
      }
    });
    
    return { valid, errors };
  };

  const parseFile = async (file: File) => {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    
    if (fileType === 'csv') {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const members = results.data.map((row: any) => {
            const name = row.Name || row.name || '';
            const strengthsStr = row.Strengths || row.strengths || row.Top5 || row.top5 || '';
            const strengths = strengthsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
            
            const { valid, errors } = validateStrengths(strengths);
            
            return {
              name: name.trim(),
              strengths: valid,
              isValid: name.trim() && valid.length > 0 && valid.length <= 5,
              errors: [
                ...(!name.trim() ? ['Name is required'] : []),
                ...(valid.length === 0 ? ['At least one valid strength is required'] : []),
                ...(valid.length > 5 ? ['Maximum 5 strengths allowed'] : []),
                ...errors
              ]
            };
          }).filter((m: ParsedMember) => m.name || m.strengths.length > 0);
          
          setParsedMembers(members);
        },
        error: (error) => {
          alert('Error parsing CSV file: ' + error.message);
        }
      });
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          const members = jsonData.map((row: any) => {
            const name = row.Name || row.name || '';
            const strengthsStr = row.Strengths || row.strengths || row.Top5 || row.top5 || '';
            const strengths = strengthsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
            
            const { valid, errors } = validateStrengths(strengths);
            
            return {
              name: name.trim(),
              strengths: valid,
              isValid: name.trim() && valid.length > 0 && valid.length <= 5,
              errors: [
                ...(!name.trim() ? ['Name is required'] : []),
                ...(valid.length === 0 ? ['At least one valid strength is required'] : []),
                ...(valid.length > 5 ? ['Maximum 5 strengths allowed'] : []),
                ...errors
              ]
            };
          }).filter((m: ParsedMember) => m.name || m.strengths.length > 0);
          
          setParsedMembers(members);
        } catch (error) {
          alert('Error parsing Excel file: ' + (error as Error).message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      parseFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    const validMembers = parsedMembers.filter(m => m.isValid);
    if (validMembers.length === 0) {
      alert('No valid team members to upload');
      return;
    }
    
    setUploading(true);
    try {
      await onUpload(validMembers.map(m => ({ name: m.name, strengths: m.strengths })));
      onClose();
    } catch (error) {
      alert('Error uploading team members: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const validCount = parsedMembers.filter(m => m.isValid).length;
  const invalidCount = parsedMembers.length - validCount;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '2.5rem',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          boxSizing: 'border-box'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'none',
            border: 'none',
            fontSize: '28px',
            cursor: 'pointer',
            color: '#6B7280',
            lineHeight: 1
          }}
        >×</button>

        <h2 style={{
          fontSize: '28px',
          fontWeight: 700,
          marginBottom: '0.5rem',
          letterSpacing: '-1px',
          color: '#1A1A1A'
        }}>Upload Team File</h2>
        
        <p style={{
          color: '#6B7280',
          fontSize: '15px',
          marginBottom: '2rem'
        }}>
          Upload a CSV or Excel file with your team members' names and strengths
        </p>

        {/* File Upload Area */}
        {!file ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? '#003566' : '#D1D5DB'}`,
              borderRadius: '16px',
              padding: '3rem 2rem',
              textAlign: 'center',
              backgroundColor: dragActive ? '#F0F9FF' : '#FAFAFA',
              transition: 'all 0.2s ease',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{
              fontSize: '48px',
              marginBottom: '1rem',
              color: '#6B7280'
            }}>📄</div>
            <p style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#1A1A1A',
              marginBottom: '0.5rem'
            }}>
              Drag and drop your file here
            </p>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              marginBottom: '1rem'
            }}>
              or
            </p>
            <label style={{
              background: '#003566',
              color: '#FFFFFF',
              padding: '0.75rem 1.5rem',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-block',
              transition: 'all 0.2s ease'
            }}>
              Browse Files
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
            <p style={{
              fontSize: '13px',
              color: '#9CA3AF',
              marginTop: '1rem'
            }}>
              Supported formats: CSV, Excel (.xlsx, .xls)
            </p>
          </div>
        ) : (
          <>
            {/* File Info */}
            <div style={{
              background: '#F5EFE7',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <p style={{ fontWeight: 600, color: '#1A1A1A', marginBottom: '0.25rem' }}>
                  {file.name}
                </p>
                <p style={{ fontSize: '13px', color: '#6B7280' }}>
                  {validCount} valid, {invalidCount} invalid
                </p>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setParsedMembers([]);
                }}
                style={{
                  background: '#E24B48',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.5rem 1rem',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>

            {/* Preview Table */}
            {parsedMembers.length > 0 && (
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                marginBottom: '1.5rem',
                border: '1px solid #E5E7EB',
                borderRadius: '12px'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#F9FAFB' }}>
                    <tr>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Name</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Strengths</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedMembers.map((member, index) => (
                      <tr key={index} style={{ borderTop: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '0.75rem', fontSize: '14px' }}>{member.name || '-'}</td>
                        <td style={{ padding: '0.75rem', fontSize: '13px', color: '#6B7280' }}>
                          {member.strengths.join(', ') || '-'}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          {member.isValid ? (
                            <span style={{
                              background: '#10B981',
                              color: '#FFFFFF',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 600
                            }}>✓ Valid</span>
                          ) : (
                            <span style={{
                              background: '#E24B48',
                              color: '#FFFFFF',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 600
                            }}>✗ Invalid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Error Messages */}
            {invalidCount > 0 && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{ fontWeight: 600, color: '#DC2626', marginBottom: '0.5rem', fontSize: '14px' }}>
                  {invalidCount} row(s) have errors:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '13px', color: '#991B1B' }}>
                  {parsedMembers.filter(m => !m.isValid).map((member, index) => (
                    <li key={index}>
                      {member.name || 'Unnamed'}: {member.errors.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Format Instructions */}
        <div style={{
          background: '#F0F9FF',
          border: '1px solid #BAE6FD',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{ fontWeight: 600, color: '#0369A1', marginBottom: '0.5rem', fontSize: '14px' }}>
            File Format Requirements:
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '13px', color: '#075985', lineHeight: '1.6' }}>
            <li>Column 1: "Name" - Team member's full name</li>
            <li>Column 2: "Strengths" - Comma-separated list of strengths (max 5)</li>
            <li>Example: John Doe, Achiever, Strategic, Learner, Focus, Analytical</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid #D1D5DB',
              borderRadius: '24px',
              backgroundColor: '#FFFFFF',
              color: '#4A4A4A',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || validCount === 0 || uploading}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '24px',
              backgroundColor: '#003566',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              cursor: (!file || validCount === 0 || uploading) ? 'not-allowed' : 'pointer',
              opacity: (!file || validCount === 0 || uploading) ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (file && validCount > 0 && !uploading) {
                e.currentTarget.style.backgroundColor = '#002244';
              }
            }}
            onMouseOut={(e) => {
              if (file && validCount > 0 && !uploading) {
                e.currentTarget.style.backgroundColor = '#003566';
              }
            }}
          >
            {uploading ? 'Uploading...' : `Add ${validCount} Member${validCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}